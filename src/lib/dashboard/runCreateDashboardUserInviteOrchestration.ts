import { createAdminClient } from "@/lib/supabase/admin";
import { auditIdentityAction } from "@/lib/audit";
import { linkGuardianAfterMinorStudentCreate } from "@/lib/dashboard/linkGuardianAfterMinorStudentCreate";
import type {
  CreateDashboardUserInvitePlan,
  CreateDashboardUserParsed,
} from "@/lib/dashboard/createDashboardUserPlan";
import { runCreateDashboardUserInviteAuthAttempts } from "@/lib/dashboard/createDashboardUserInviteAuthAttempts";
import type { CreateDashboardUserResult } from "@/lib/dashboard/createDashboardUserInviteResult";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";
import { localizeCreateDashboardUserError } from "@/lib/dashboard/localizeCreateDashboardUser";
import { upsertAdminInvitedProfile } from "@/lib/dashboard/upsertAdminInvitedProfile";
import { resolveDashboardInviteSignupAttemptSubjectLog } from "@/lib/logging/authInviteAttemptLogMeta";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { AppLocale } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/types/i18n";

const SYNTHETIC_MINOR_EMAIL_MAX_ATTEMPTS = 16;

export type { CreateDashboardUserResult } from "@/lib/dashboard/createDashboardUserInviteResult";

/** Core admin invite provisioning after validation + invite plan resolved. */
export async function runCreateDashboardUserInviteOrchestration(params: {
  actorId: string;
  dict: Dictionary;
  appLocale: AppLocale;
  parsed: CreateDashboardUserParsed;
  planOk: Extract<CreateDashboardUserInvitePlan, { ok: true }>;
}): Promise<CreateDashboardUserResult> {
  const { actorId, dict, appLocale, parsed } = params;
  const plan = params.planOk;
  const { effectiveEmail, effectivePhone, minorLinkInput, minorSyntheticEmailSource, meta, inviteProfile } =
    plan;
  const creatingMinorStudent = minorLinkInput != null;
  const signupAttemptSubject = resolveDashboardInviteSignupAttemptSubjectLog({
    creatingMinorStudent,
    minorSyntheticEmailSource,
    inviteRole: inviteProfile.role,
  });
  const dniOrPassport = parsed.dni_or_passport;
  const birthDate = parsed.birth_date?.trim();
  const pwd = parsed.password.trim();
  const finalPassword = pwd.length >= 6 ? pwd : ADMIN_INVITE_DEFAULT_PASSWORD;

  const admin = createAdminClient();

  async function afterProfileOk(uid: string): Promise<CreateDashboardUserResult> {
    if (!minorLinkInput) {
      return { ok: true, userId: uid };
    }
    const linkRes = await linkGuardianAfterMinorStudentCreate(appLocale, dict, {
      studentId: uid,
      ...minorLinkInput,
    });
    if (linkRes.kind === "error") {
      return { ok: false, message: linkRes.message };
    }
    if (linkRes.kind === "needs_guardian_reuse_confirm") {
      return {
        ok: false,
        needsGuardianReuseConfirm: true,
        userId: uid,
        reuseKind: linkRes.reuseKind,
        existingProfileId: linkRes.existingProfileId,
      };
    }
    return { ok: true, userId: uid };
  }

  const maxAttempts = minorSyntheticEmailSource ? SYNTHETIC_MINOR_EMAIL_MAX_ATTEMPTS : 1;

  const authOutcome = await runCreateDashboardUserInviteAuthAttempts({
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
    firstNameForAudit: parsed.first_name,
    lastNameForAudit: parsed.last_name,
    afterProfileOk,
    maxAttempts,
  });

  if (authOutcome.outcome === "done") {
    return authOutcome.result;
  }

  const uid = authOutcome.userId;
  const emailNorm = authOutcome.normalizedEmail;

  const { error: profileErr } = await upsertAdminInvitedProfile(admin, {
    userId: uid,
    ...inviteProfile,
  });
  if (profileErr) {
    logSupabaseClientError("createDashboardUser:profilesUpsert", profileErr, { userId: uid });
    return { ok: false, message: localizeCreateDashboardUserError(dict, "profile_save_failed") };
  }

  void auditIdentityAction({
    actorId,
    actorRole: "admin",
    action: "create",
    resourceType: "profile",
    resourceId: uid,
    summary: "Admin created dashboard user",
    afterValues: {
      id: uid,
      email: emailNorm,
      role: inviteProfile.role,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      dni_or_passport: dniOrPassport ?? "",
      phone: effectivePhone ?? "",
      birth_date: birthDate && birthDate.length >= 10 ? birthDate.slice(0, 10) : null,
    },
    metadata: { provisioning_source: "admin_invite" },
  });
  return afterProfileOk(uid);
}
