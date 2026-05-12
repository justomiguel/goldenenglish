import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnsureParentProfileResult } from "@/lib/register/tutorEnsureParentOutcome";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";
import { resolveAuthAdminInviteCreateUserIssue } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";
import {
  logAuthAdminCreateUserFailure,
  logServerWarn,
} from "@/lib/logging/serverActionLog";
import { authInviteCollisionEmailMeta } from "@/lib/logging/authInviteAttemptLogMeta";
import { createIncidentSupportRef } from "@/lib/server/createIncidentSupportRef";
import { normalizeDni } from "@/lib/import/studentImportUtils";
import { parentDefaultEmail } from "@/lib/import/parentDefaultEmail";
import { resolveTutorParentAuthEmailConflict } from "@/lib/register/resolveTutorParentAuthEmailConflict";

function inviteMetaParent(fields: Record<string, string>): Record<string, string> {
  return { ...fields, provisioning_source: "admin_invite", role: "parent" };
}

function tutorInviteIssueToCode(
  issue: ReturnType<typeof resolveAuthAdminInviteCreateUserIssue>,
): string {
  switch (issue) {
    case "email_exists":
      return "tutor_auth_email_exists";
    case "weak_password":
      return "tutor_auth_weak_password";
    case "invalid_email":
      return "tutor_auth_invalid_email";
    case "rate_limited":
      return "tutor_auth_rate_limited";
    case "signup_disabled":
      return "tutor_auth_signup_disabled";
    default:
      return "tutor_auth_unexpected";
  }
}

export type { EnsureParentReuseKind, EnsureParentProfileResult } from "@/lib/register/tutorEnsureParentOutcome";

/**
 * Creates or reuses a parent/tutor profile by national ID (same semantics as CSV import).
 */
export async function ensureParentProfileByTutorDni(
  admin: SupabaseClient,
  input: {
    tutorDniRaw: string;
    tutorEmail: string | null | undefined;
    tutorPhone: string | null | undefined;
    tutorFirstName: string;
    tutorLastName: string;
  },
): Promise<EnsureParentProfileResult> {
  const raw = input.tutorDniRaw.trim();
  if (!raw) {
    return { ok: false, message: "tutor_dni_required" };
  }
  const { dni } = normalizeDni(raw);
  const email = (input.tutorEmail?.trim() || parentDefaultEmail(dni)).toLowerCase();
  const meta = inviteMetaParent({
    first_name: input.tutorFirstName.trim(),
    last_name: input.tutorLastName.trim(),
    dni_or_passport: dni,
    phone: input.tutorPhone?.trim() || "",
    birth_date: "",
  });

  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("dni_or_passport", dni)
    .maybeSingle();

  if (existing?.id) {
    if (existing.role === "parent") {
      return {
        ok: true,
        parentId: existing.id as string,
        reuseKind: "reused_parent",
      };
    }
    if (existing.role === "admin") {
      return {
        ok: true,
        parentId: existing.id as string,
        reuseKind: "reused_admin",
      };
    }
    return { ok: false, message: "tutor_dni_in_use_by_student" };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: ADMIN_INVITE_DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) {
    const issue = resolveAuthAdminInviteCreateUserIssue(error);
    const incidentRef =
      issue === "unexpected" ? createIncidentSupportRef() : undefined;
    logAuthAdminCreateUserFailure("ensureParentProfileByTutorDni:authAdminCreateUser", error, {
      classified_issue: issue,
      signup_attempt_subject: "guardian_parent_new_auth_user",
      tutor_email_provided_explicitly: Boolean(input.tutorEmail?.trim()),
      ...(issue === "email_exists" ? authInviteCollisionEmailMeta(email) : {}),
      ...(incidentRef ? { incidentRef } : {}),
    });

    if (issue === "email_exists") {
      const rescued = await resolveTutorParentAuthEmailConflict(admin, {
        normalizedEmail: email,
        tutorDni: dni,
        tutorFirstName: input.tutorFirstName.trim(),
        tutorLastName: input.tutorLastName.trim(),
        tutorPhone: input.tutorPhone,
        authUserMetadata: meta,
      });
      if (rescued != null) {
        if (rescued.ok && rescued.reuseKind === "provisioned_prior_auth") {
          logServerWarn("ensureParentProfileByTutorDni:provisionedPriorAuthRepair", {
            parentId: rescued.parentId,
            signup_attempt_subject: "guardian_parent_new_auth_user",
          });
        }
        return rescued;
      }
    }

    return {
      ok: false,
      message: tutorInviteIssueToCode(issue),
      ...(incidentRef ? { incidentRef } : {}),
    };
  }
  if (!created.user) {
    const incidentRef = createIncidentSupportRef();
    logAuthAdminCreateUserFailure(
      "ensureParentProfileByTutorDni:authAdminCreateUser",
      { message: "missing_user_in_createUser_response", code: "no_auth_user_payload" },
      {
        classified_issue: "no_user_payload",
        signup_attempt_subject: "guardian_parent_new_auth_user",
        tutor_email_provided_explicitly: Boolean(input.tutorEmail?.trim()),
        incidentRef,
      },
    );
    return {
      ok: false,
      message: "tutor_auth_no_user_returned",
      incidentRef,
    };
  }
  return { ok: true, parentId: created.user.id, reuseKind: "created" };
}

export async function upsertTutorStudentLink(
  admin: SupabaseClient,
  tutorId: string,
  studentId: string,
  relationship: string | null | undefined,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await admin.from("tutor_student_rel").upsert(
    {
      tutor_id: tutorId,
      student_id: studentId,
      relationship: relationship?.trim() || null,
    },
    { onConflict: "tutor_id,student_id" },
  );
  if (error) return { ok: false, message: "link_failed" };
  return { ok: true };
}
