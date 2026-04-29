"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { verifyUserPassword } from "@/lib/supabase/verifyUserPassword";
import { buildResetByDniPlan } from "@/lib/auth/buildResetByDniPlan";
import { sendAdminPasswordResetNoticeEmail } from "@/lib/email/sendAdminPasswordResetNoticeEmail";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { getBrandPublic } from "@/lib/brand/server";
import {
  logServerAuthzDenied,
  logServerActionException,
  logServerActionInvariantViolation,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "adminUserDetailCredentialActions";

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

function pickLocale(raw: string): AppLocale {
  return locales.includes(raw as AppLocale) ? (raw as AppLocale) : defaultLocale;
}

const passwordSchema = z.object({
  locale: localeZ,
  targetUserId: uuidZ,
  password: z.string().min(8).max(72),
  confirmed: z.literal(true),
});

export async function setAdminUserPasswordFromDetailAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = passwordSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrPasswordPolicy };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:setPassword`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(parsed.data.targetUserId, {
      password: parsed.data.password,
    });
    if (error) {
      logSupabaseClientError(`${S}:setPassword`, error, { targetUserId: parsed.data.targetUserId });
      return { ok: false, message: dict.admin.users.detailErrSave };
    }
    void recordSystemAudit({
      action: "admin_user_detail_set_password",
      resourceType: "auth_user",
      resourceId: parsed.data.targetUserId,
      payload: {},
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${parsed.data.targetUserId}`);
    return { ok: true, message: dict.admin.users.detailToastPasswordSet };
  } catch (e) {
    logServerActionException(S, e, { op: "setPassword" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}

const dniResetSchema = z.object({
  locale: localeZ,
  targetUserId: uuidZ,
  adminPassword: z.string().min(1).max(200),
  confirmed: z.literal(true),
});

export type ResetUserPasswordByDniResult =
  | { ok: true; password: string; hasRealEmail: boolean; message?: string }
  | { ok: false; message?: string };

/**
 * One-click "Reset by DNI" for students without a real email.
 *
 * Trust boundary contract (rule 17):
 * 1. Step-up re-auth: the admin must re-enter their own password (cross-account
 *    credential change with the service role).
 * 2. Audit: persisted to `system_config_audit` via `recordSystemAudit`. The
 *    generated password is NEVER included in the payload.
 * 3. Notification: best-effort email to the account holder, but only when the
 *    address on file is real (synthetic `@students.goldenenglish.local` /
 *    `@parents.goldenenglish.local` addresses bounce — skipped).
 *
 * Setting `app_metadata.must_change_password = true` makes the proxy / login
 * middleware redirect the next session to `/{locale}/reset-password`. Changing
 * the password also rotates Supabase auth refresh tokens, so existing sessions
 * cannot keep operating after their access token expires.
 */
export async function resetUserPasswordByDniAction(
  raw: unknown,
): Promise<ResetUserPasswordByDniResult> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = dniResetSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailDniResetErrTargetMissing };
    }
    locale = pickLocale(parsed.data.locale);
    const dict = await getDictionary(locale);

    let adminUserId: string;
    let adminEmail: string;
    try {
      const { user } = await assertAdmin();
      adminUserId = user.id;
      adminEmail = (user.email ?? "").trim().toLowerCase();
    } catch {
      logServerAuthzDenied(`${S}:resetByDni`);
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    if (!adminEmail) {
      return { ok: false, message: dict.admin.users.detailDniResetErrAdminPassword };
    }
    const reauthOk = await verifyUserPassword(adminEmail, parsed.data.adminPassword);
    if (!reauthOk) {
      return { ok: false, message: dict.admin.users.detailDniResetErrAdminPassword };
    }

    const admin = createAdminClient();

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("dni_or_passport, role")
      .eq("id", parsed.data.targetUserId)
      .maybeSingle();
    if (profileErr) {
      logSupabaseClientError(`${S}:resetByDni:profile`, profileErr, {
        targetUserId: parsed.data.targetUserId,
      });
      return { ok: false, message: dict.admin.users.detailDniResetErrSave };
    }
    const dni = ((profile as { dni_or_passport?: string } | null)?.dni_or_passport ?? "").trim();
    if (!dni) {
      return { ok: false, message: dict.admin.users.detailDniResetErrTargetMissing };
    }

    const { data: authData, error: authErr } = await admin.auth.admin.getUserById(
      parsed.data.targetUserId,
    );
    if (authErr || !authData?.user) {
      if (authErr) {
        logSupabaseClientError(`${S}:resetByDni:authRead`, authErr, {
          targetUserId: parsed.data.targetUserId,
        });
      }
      return { ok: false, message: dict.admin.users.detailDniResetErrSave };
    }
    const targetEmail = (authData.user.email ?? "").trim();
    const existingAppMetadata = (authData.user.app_metadata ?? {}) as Record<string, unknown>;

    const plan = buildResetByDniPlan({ dni, currentEmail: targetEmail });

    const { error: updateErr } = await admin.auth.admin.updateUserById(
      parsed.data.targetUserId,
      {
        password: plan.generatedPassword,
        app_metadata: { ...existingAppMetadata, must_change_password: true },
      },
    );
    if (updateErr) {
      logSupabaseClientError(`${S}:resetByDni:update`, updateErr, {
        targetUserId: parsed.data.targetUserId,
      });
      return { ok: false, message: dict.admin.users.detailDniResetErrSave };
    }

    if (plan.hasRealEmail && targetEmail) {
      try {
        const r = await sendAdminPasswordResetNoticeEmail({
          to: targetEmail,
          brand: getBrandPublic(),
          locale,
          emailProvider: getEmailProvider(),
        });
        if (!r.ok) {
          logServerActionInvariantViolation(
            `${S}:resetByDni:notify`,
            r.error ?? "send_failed",
            { targetUserId: parsed.data.targetUserId },
          );
        }
      } catch (e) {
        logServerException(`${S}:resetByDni:notify_throw`, e, {
          targetUserId: parsed.data.targetUserId,
        });
      }
    }

    void recordSystemAudit({
      action: "admin.user.password_reset_by_dni",
      resourceType: "auth_user",
      resourceId: parsed.data.targetUserId,
      payload: {
        actorId: adminUserId,
        hasRealEmail: plan.hasRealEmail,
        dniPresent: true,
        mustChangeFlagSet: true,
      },
    });

    revalidatePath(`/${locale}/dashboard/admin/users/${parsed.data.targetUserId}`);
    return {
      ok: true,
      password: plan.generatedPassword,
      hasRealEmail: plan.hasRealEmail,
      message: dict.admin.users.detailDniResetToastOk,
    };
  } catch (e) {
    logServerActionException(S, e, { op: "resetByDni" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailDniResetErrSave };
  }
}

