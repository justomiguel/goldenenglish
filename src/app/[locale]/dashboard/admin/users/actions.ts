"use server";

import type { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditIdentityAction } from "@/lib/audit";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";
import { resolveAuthAdminCreateUserDiagnostic } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";
import {
  localizeCreateDashboardUserError,
  localizeCreateDashboardUserZod,
} from "@/lib/dashboard/localizeCreateDashboardUser";
import { repairAdminInviteWhenEmailExists } from "@/lib/dashboard/repairAdminInviteWhenEmailExists";
import { upsertAdminInvitedProfile } from "@/lib/dashboard/upsertAdminInvitedProfile";
import {
  createDashboardUserSchema,
  planCreateDashboardUserInvite,
} from "@/lib/dashboard/createDashboardUserPlan";
import { linkGuardianAfterMinorStudentCreate } from "@/lib/dashboard/linkGuardianAfterMinorStudentCreate";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { randomLowercaseAlphaString } from "@/lib/server/randomLowercaseAlphaString";

const SYNTHETIC_MINOR_EMAIL_MAX_ATTEMPTS = 16;

export type CreateDashboardUserResult =
  | { ok: true; userId: string }
  | { ok: false; message?: string }
  | {
      ok: false;
      needsGuardianReuseConfirm: true;
      userId: string;
      reuseKind: "reused_parent" | "reused_admin";
      existingProfileId: string;
    };

export async function createDashboardUser(
  raw: z.infer<typeof createDashboardUserSchema>,
): Promise<CreateDashboardUserResult> {
  let actorId = "";
  try {
    const ctx = await assertAdmin();
    actorId = ctx.user.id;
  } catch {
    logServerAuthzDenied("createDashboardUser");
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: localizeCreateDashboardUserError(dict, "forbidden") };
  }

  const localeForDict = typeof raw.locale === "string" ? raw.locale : defaultLocale;

  const parsed = createDashboardUserSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(localeForDict);
    return {
      ok: false,
      message: localizeCreateDashboardUserZod(dict, parsed.error.issues),
    };
  }

  const dict = await getDictionary(parsed.data.locale ?? defaultLocale);
  const appLocale: AppLocale = locales.includes((parsed.data.locale ?? defaultLocale) as AppLocale)
    ? ((parsed.data.locale ?? defaultLocale) as AppLocale)
    : defaultLocale;

  const pwd = parsed.data.password.trim();
  if (pwd.length > 0 && pwd.length < 6) {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "password_policy") };
  }
  const finalPassword = pwd.length >= 6 ? pwd : ADMIN_INVITE_DEFAULT_PASSWORD;

  const plan = planCreateDashboardUserInvite(dict, parsed.data);
  if (!plan.ok) {
    return { ok: false, message: plan.message };
  }

  const { effectiveEmail, effectivePhone, minorLinkInput, minorSyntheticEmailSource, meta, inviteProfile } =
    plan;
  const dniOrPassport = parsed.data.dni_or_passport;
  const birthDate = parsed.data.birth_date?.trim();

  const admin = createAdminClient();

  async function afterProfileOk(uid: string): Promise<CreateDashboardUserResult> {
    if (minorLinkInput) {
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
    }
    return { ok: true, userId: uid };
  }

  function mapRepairFailure(repaired: { kind: "failed"; diagnostic: string }): CreateDashboardUserResult {
    if (repaired.diagnostic === "weak_password") {
      return { ok: false, message: localizeCreateDashboardUserError(dict, "weak_password") };
    }
    if (repaired.diagnostic === "profile_save") {
      return { ok: false, message: localizeCreateDashboardUserError(dict, "profile_save_failed") };
    }
    if (repaired.diagnostic === "list_users") {
      return { ok: false, message: localizeCreateDashboardUserError(dict, "auth_failed") };
    }
    return { ok: false, message: localizeCreateDashboardUserError(dict, "auth_failed") };
  }

  const maxAttempts = minorSyntheticEmailSource ? SYNTHETIC_MINOR_EMAIL_MAX_ATTEMPTS : 1;
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
      logSupabaseClientError("createDashboardUser:authAdminCreateUser", error, {
        attempt,
        syntheticDedupe: Boolean(minorSyntheticEmailSource && attempt > 0),
      });
      const diag = resolveAuthAdminCreateUserDiagnostic(error);
      if (diag !== "email_exists") {
        if (diag === "weak_password") {
          return { ok: false, message: localizeCreateDashboardUserError(dict, "weak_password") };
        }
        return { ok: false, message: localizeCreateDashboardUserError(dict, "auth_failed") };
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
            first_name: parsed.data.first_name,
            last_name: parsed.data.last_name,
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
        return afterProfileOk(uid);
      }
      if (repaired.kind === "failed") {
        return mapRepairFailure(repaired);
      }

      if (attempt >= maxAttempts - 1) {
        return { ok: false, message: localizeCreateDashboardUserError(dict, "email_exists") };
      }
      continue;
    }

    return { ok: false, message: localizeCreateDashboardUserError(dict, "no_user_returned") };
  }

  if (!resolvedUserId) {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "email_exists") };
  }

  const uid = resolvedUserId;
  const emailNorm = normalizedEmailUsed;
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
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      dni_or_passport: dniOrPassport ?? "",
      phone: effectivePhone ?? "",
      birth_date: birthDate && birthDate.length >= 10 ? birthDate.slice(0, 10) : null,
    },
    metadata: { provisioning_source: "admin_invite" },
  });
  return afterProfileOk(uid);
}
