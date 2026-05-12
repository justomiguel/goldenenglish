import type { Dictionary } from "@/types/i18n";
import type { SupabaseClient } from "@supabase/supabase-js";
import { auditIdentityAction } from "@/lib/audit";
import {
  localizeAdminInviteAuthIssue,
  localizeCreateDashboardUserError,
  localizeMinorStudentInviteAuthIssue,
} from "@/lib/dashboard/localizeCreateDashboardUser";
import { appendAuthIncidentReferenceLine } from "@/lib/dashboard/appendAuthIncidentReferenceLine";
import { repairAdminInviteWhenEmailExists } from "@/lib/dashboard/repairAdminInviteWhenEmailExists";
import { resolveAuthAdminInviteCreateUserIssue } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";
import type { AdminInvitedProfileFields } from "@/lib/dashboard/upsertAdminInvitedProfile";
import {
  authInviteCollisionEmailMeta,
  resolveDashboardInviteSignupAttemptSubjectLog,
} from "@/lib/logging/authInviteAttemptLogMeta";
import {
  logAuthAdminCreateUserFailure,
  logServerWarn,
} from "@/lib/logging/serverActionLog";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { randomLowercaseAlphaString } from "@/lib/server/randomLowercaseAlphaString";
import { createIncidentSupportRef } from "@/lib/server/createIncidentSupportRef";
import type { MinorSyntheticEmailSource } from "@/lib/dashboard/createDashboardUserPlan";
import type { CreateDashboardUserResult } from "@/lib/dashboard/createDashboardUserInviteResult";

export type InviteAuthAttemptsResult =
  | { outcome: "auth_user_ready"; userId: string; normalizedEmail: string }
  | { outcome: "done"; result: CreateDashboardUserResult };

export type InviteAuthAttemptsArgs = {
  admin: SupabaseClient;
  actorId: string;
  dict: Dictionary;
  effectiveEmail: string;
  effectivePhone: string | null;
  minorSyntheticEmailSource: MinorSyntheticEmailSource | null | undefined;
  creatingMinorStudent: boolean;
  finalPassword: string;
  meta: Record<string, string>;
  signupAttemptSubject: ReturnType<typeof resolveDashboardInviteSignupAttemptSubjectLog>;
  inviteProfile: Omit<AdminInvitedProfileFields, "userId">;
  dniOrPassport: string | null;
  birthDate: string | undefined;
  firstNameForAudit: string;
  lastNameForAudit: string;
  afterProfileOk: (uid: string) => Promise<CreateDashboardUserResult>;
  maxAttempts: number;
};

function mapRepairFailure(
  dict: Dictionary,
  creatingMinorStudent: boolean,
  repaired: { kind: "failed"; diagnostic: string },
): CreateDashboardUserResult {
  const incidentRef = createIncidentSupportRef();
  logServerWarn("createDashboardUser:repairAdminInviteFailed", {
    diagnostic: repaired.diagnostic,
    incidentRef,
  });
  if (repaired.diagnostic === "weak_password") {
    return {
      ok: false,
      message: creatingMinorStudent
        ? localizeMinorStudentInviteAuthIssue(dict, "weak_password")
        : localizeCreateDashboardUserError(dict, "weak_password"),
    };
  }
  if (repaired.diagnostic === "profile_save") {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "profile_save_failed") };
  }
  const unexpected = creatingMinorStudent
    ? localizeMinorStudentInviteAuthIssue(dict, "unexpected", { supportRef: incidentRef })
    : localizeAdminInviteAuthIssue(dict, "unexpected", { supportRef: incidentRef });
  return { ok: false, message: unexpected };
}

export async function runCreateDashboardUserInviteAuthAttempts(
  args: InviteAuthAttemptsArgs,
): Promise<InviteAuthAttemptsResult> {
  const {
    admin,
    actorId,
    dict,
    effectiveEmail,
    effectivePhone,
    minorSyntheticEmailSource,
    creatingMinorStudent,
    finalPassword,
    meta,
    signupAttemptSubject,
    inviteProfile,
    dniOrPassport,
    birthDate,
    firstNameForAudit,
    lastNameForAudit,
    afterProfileOk,
    maxAttempts,
  } = args;

  const syntheticEmailExhaustedMessage = minorSyntheticEmailSource
    ? dict.admin.users.inviteAuthMinorStudentEmailExists
    : localizeCreateDashboardUserError(dict, "email_exists");

  let resolvedUserId: string | null = null;
  let normalizedEmailUsed = effectiveEmail.trim().toLowerCase();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let emailTry = effectiveEmail.trim().toLowerCase();
    if (minorSyntheticEmailSource && attempt > 0) {
      const suffixLen = Math.min(2 + attempt, 10);
      emailTry = composeSyntheticMinorStudentEmail(
        minorSyntheticEmailSource.first_name,
        minorSyntheticEmailSource.last_name,
        minorSyntheticEmailSource.dni,
        minorSyntheticEmailSource.domain,
        { coreSuffix: randomLowercaseAlphaString(suffixLen) },
      ).toLowerCase();
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email: emailTry,
      password: finalPassword,
      email_confirm: true,
      user_metadata: meta,
    });

    if (!error && created?.user) {
      resolvedUserId = created.user.id;
      normalizedEmailUsed = emailTry;
      break;
    }

    if (error) {
      const issue = resolveAuthAdminInviteCreateUserIssue(error);
      const incidentRef = issue === "unexpected" ? createIncidentSupportRef() : undefined;

      logAuthAdminCreateUserFailure("createDashboardUser:authAdminCreateUser", error, {
        classified_issue: issue,
        signup_attempt_subject: signupAttemptSubject,
        invite_profile_role: inviteProfile.role,
        attempt,
        syntheticDedupeAttempt: Boolean(minorSyntheticEmailSource && attempt > 0),
        ...(issue === "email_exists" ? authInviteCollisionEmailMeta(emailTry) : {}),
        ...(incidentRef ? { incidentRef } : {}),
      });

      if (issue !== "email_exists") {
        const supportArg = incidentRef !== undefined ? { supportRef: incidentRef } : undefined;
        const message = creatingMinorStudent
          ? localizeMinorStudentInviteAuthIssue(dict, issue, supportArg)
          : issue === "weak_password"
            ? localizeCreateDashboardUserError(dict, "weak_password")
            : localizeAdminInviteAuthIssue(dict, issue, supportArg);
        return { outcome: "done", result: { ok: false, message } };
      }

      const repaired = await repairAdminInviteWhenEmailExists({
        admin,
        normalizedEmail: emailTry,
        password: finalPassword,
        userMetadata: meta,
        profile: inviteProfile,
      });

      if (repaired.kind === "repaired") {
        const uid = repaired.userId;
        void auditIdentityAction({
          actorId,
          actorRole: "admin",
          action: "update",
          resourceType: "profile",
          resourceId: uid,
          summary: "Admin completed profile for existing Auth user (admin invite repair)",
          afterValues: {
            id: uid,
            email: emailTry,
            role: inviteProfile.role,
            first_name: firstNameForAudit,
            last_name: lastNameForAudit,
            dni_or_passport: dniOrPassport ?? "",
            phone: effectivePhone ?? "",
            birth_date:
              birthDate && birthDate.length >= 10 ? birthDate.slice(0, 10) : null,
          },
          metadata: {
            provisioning_source: "admin_invite",
            repaired_orphan_auth_user: true,
          },
        });
        return { outcome: "done", result: await afterProfileOk(uid) };
      }
      if (repaired.kind === "failed") {
        return {
          outcome: "done",
          result: mapRepairFailure(dict, creatingMinorStudent, repaired),
        };
      }

      if (attempt >= maxAttempts - 1) {
        return {
          outcome: "done",
          result: { ok: false, message: syntheticEmailExhaustedMessage },
        };
      }
      continue;
    }

    const noUserIncidentRef = createIncidentSupportRef();
    logServerWarn("createDashboardUser:createUserReturnedNoAuthUserPayload", {
      attempt,
      syntheticDedupeAttempt: Boolean(minorSyntheticEmailSource && attempt > 0),
      incidentRef: noUserIncidentRef,
    });

    return {
      outcome: "done",
      result: {
        ok: false,
        message: creatingMinorStudent
          ? appendAuthIncidentReferenceLine(
              dict,
              dict.admin.users.inviteAuthMinorStudentNoUserReturned,
              noUserIncidentRef,
            )
          : localizeCreateDashboardUserError(dict, "no_user_returned", {
              supportRef: noUserIncidentRef,
            }),
      },
    };
  }

  if (!resolvedUserId) {
    return {
      outcome: "done",
      result: { ok: false, message: syntheticEmailExhaustedMessage },
    };
  }

  return {
    outcome: "auth_user_ready",
    userId: resolvedUserId,
    normalizedEmail: normalizedEmailUsed,
  };
}
