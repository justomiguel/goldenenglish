import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnsureParentReuseKind } from "@/lib/register/tutorEnsureParentOutcome";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";
import { upsertAdminInvitedProfile } from "@/lib/dashboard/upsertAdminInvitedProfile";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import {
  resolveAuthAdminInviteCreateUserIssue,
  resolveAuthAdminCreateUserDiagnostic,
} from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";
import { logAuthAdminCreateUserFailure, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { normalizeDni } from "@/lib/import/studentImportUtils";

function normalizedDniKey(raw: string): string {
  return normalizeDni(raw).dni.toLowerCase();
}

function tutorDnisMatch(profileDni: string | null | undefined, tutorDniNormalized: string): boolean {
  const p = (profileDni ?? "").trim();
  if (!p) return false;
  return normalizedDniKey(p) === tutorDniNormalized;
}

/** When tutor provisioning hits `email_exists`, reconcile orphan Auth-only users or reuse existing portals. */
export async function resolveTutorParentAuthEmailConflict(
  admin: SupabaseClient,
  opts: {
    normalizedEmail: string;
    tutorDni: string;
    tutorFirstName: string;
    tutorLastName: string;
    tutorPhone: string | null | undefined;
    authUserMetadata: Record<string, string>;
  },
): Promise<
  | { ok: true; parentId: string; reuseKind: EnsureParentReuseKind }
  | { ok: false; message: string }
  | null
> {
  const targetDniKey = normalizedDniKey(opts.tutorDni);
  const { userId: authUid, error: findErr } = await findAuthUserIdByNormalizedEmail(
    admin,
    opts.normalizedEmail,
  );
  if (findErr) {
    logSupabaseClientError("resolveTutorParentAuthEmailConflict:findAuthUser", findErr);
    return null;
  }
  if (!authUid) {
    return null;
  }

  const { data: existingProfile, error: profErr } = await admin
    .from("profiles")
    .select("id, role, dni_or_passport")
    .eq("id", authUid)
    .maybeSingle();

  if (profErr || !existingProfile?.id) {
    if (profErr) {
      logSupabaseClientError("resolveTutorParentAuthEmailConflict:profilesRead", profErr, {
        candidateUserId: authUid,
      });
      return null;
    }
    /** Orphan Auth user (login exists, no portal row): align with admin-invite repair. */
    const { error: updErr } = await admin.auth.admin.updateUserById(authUid, {
      password: ADMIN_INVITE_DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: opts.authUserMetadata,
    });
    if (updErr) {
      const issue = resolveAuthAdminInviteCreateUserIssue(updErr);
      logAuthAdminCreateUserFailure(
        "resolveTutorParentAuthEmailConflict:repairUpdateUserById",
        updErr,
        { classified_issue: issue, signup_attempt_subject: "guardian_parent_new_auth_user" },
      );
      const diag = resolveAuthAdminCreateUserDiagnostic(updErr);
      if (diag === "weak_password") {
        return { ok: false, message: "tutor_auth_weak_password" };
      }
      return null;
    }
    const { error: upsertErr } = await upsertAdminInvitedProfile(admin, {
      userId: authUid,
      role: "parent",
      first_name: opts.tutorFirstName.trim(),
      last_name: opts.tutorLastName.trim(),
      dni_or_passport: normalizeDni(opts.tutorDni).dni,
      phone: opts.tutorPhone?.trim() ? opts.tutorPhone.trim() : null,
      birth_date: undefined,
    });
    if (upsertErr) {
      logSupabaseClientError("resolveTutorParentAuthEmailConflict:profilesUpsert", upsertErr, {
        userId: authUid,
      });
      return null;
    }
    return { ok: true, parentId: authUid, reuseKind: "provisioned_prior_auth" };
  }

  const role = String(existingProfile.role);
  const profDni = existingProfile.dni_or_passport as string | null | undefined;

  if (role === "parent") {
    if (tutorDnisMatch(profDni, targetDniKey)) {
      return { ok: true, parentId: authUid as string, reuseKind: "reused_parent" };
    }
    return {
      ok: false,
      message: "tutor_email_parent_dni_mismatch",
    };
  }
  if (role === "admin") {
    if (tutorDnisMatch(profDni, targetDniKey)) {
      return { ok: true, parentId: authUid as string, reuseKind: "reused_admin" };
    }
    return {
      ok: false,
      message: "tutor_email_admin_dni_mismatch",
    };
  }
  return {
    ok: false,
    message: "tutor_email_in_use_non_parent_role",
  };
}
