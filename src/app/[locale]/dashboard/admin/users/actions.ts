"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { z, type ZodIssue } from "zod";
import { getDictionary, defaultLocale } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/types/i18n";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditIdentityAction } from "@/lib/audit";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";
import { resolveAuthAdminCreateUserDiagnostic } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";
import { resolveCreateDashboardUserZodMessageCode } from "@/lib/dashboard/resolveCreateDashboardUserZodMessageCode";

function localizeCreateDashboardUserError(dict: Dictionary, code: string): string {
  const U = dict.admin.users;
  switch (code) {
    case "forbidden":
      return U.errCreateForbidden;
    case "invalid_data":
      return U.errCreateInvalid;
    case "password_policy":
      return U.errCreatePassword;
    case "auth_failed":
      return U.errCreateAuth;
    case "no_user_returned":
      return U.errCreateNoUser;
    case "email_exists":
      return U.errCreateEmailExists;
    case "weak_password":
      return U.errCreateWeakPassword;
    case "profile_save_failed":
      return U.errCreateProfileSave;
    default:
      return U.errCreateAuth;
  }
}

function localizeCreateDashboardUserZod(dict: Dictionary, issues: ZodIssue[]): string {
  const key = resolveCreateDashboardUserZodMessageCode(issues);
  const U = dict.admin.users;
  switch (key) {
    case "invalid_email":
      return U.errCreateInvalidEmail;
    case "invalid_role":
      return U.errCreateInvalidRole;
    case "first_name_required":
      return U.errCreateFirstNameRequired;
    case "first_name_too_long":
      return U.errCreateFirstNameTooLong;
    case "last_name_required":
      return U.errCreateLastNameRequired;
    case "last_name_too_long":
      return U.errCreateLastNameTooLong;
    case "dni_too_long":
      return U.errCreateDniTooLong;
    case "phone_too_long":
      return U.errCreatePhoneTooLong;
    case "password_too_long":
      return U.errCreatePasswordTooLong;
    case "birth_date_invalid":
      return U.errCreateBirthDateInvalid;
    default:
      return U.errCreateInvalid;
  }
}

const roleZ = z.enum(["admin", "teacher", "student", "parent", "assistant"]);

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().max(72),
  role: roleZ.optional(),
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni_or_passport: z
    .string()
    .max(32)
    .transform((s) => {
      const t = s.trim();
      return t === "" ? null : t;
    }),
  phone: z
    .string()
    .max(40)
    .transform((s) => {
      const t = s.trim();
      return t === "" ? null : t;
    }),
  birth_date: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ),
  locale: z.string().min(2).max(8).optional(),
});

export async function createDashboardUser(
  raw: z.infer<typeof createUserSchema>,
): Promise<{ ok: boolean; message?: string; userId?: string }> {
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

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(localeForDict);
    return {
      ok: false,
      message: localizeCreateDashboardUserZod(dict, parsed.error.issues),
    };
  }

  const dict = await getDictionary(parsed.data.locale ?? defaultLocale);
  const pwd = parsed.data.password.trim();
  if (pwd.length > 0 && pwd.length < 6) {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "password_policy") };
  }
  const finalPassword =
    pwd.length >= 6 ? pwd : ADMIN_INVITE_DEFAULT_PASSWORD;
  const finalRole = parsed.data.role ?? "student";
  const dniOrPassport = parsed.data.dni_or_passport;
  const phone = parsed.data.phone;

  const admin = createAdminClient();
  const meta: Record<string, string> = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    provisioning_source: "admin_invite",
    role: finalRole,
  };
  if (dniOrPassport) meta.dni_or_passport = dniOrPassport;
  if (phone) meta.phone = phone;
  const bd = parsed.data.birth_date?.trim();
  if (bd) meta.birth_date = bd;

  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: finalPassword,
    email_confirm: true,
    user_metadata: meta,
  });

  if (error) {
    logSupabaseClientError("createDashboardUser:authAdminCreateUser", error);
    const diag = resolveAuthAdminCreateUserDiagnostic(error);
    if (diag === "email_exists") {
      return { ok: false, message: localizeCreateDashboardUserError(dict, "email_exists") };
    }
    if (diag === "weak_password") {
      return { ok: false, message: localizeCreateDashboardUserError(dict, "weak_password") };
    }
    return { ok: false, message: localizeCreateDashboardUserError(dict, "auth_failed") };
  }
  if (!created.user) {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "no_user_returned") };
  }

  const uid = created.user.id;
  const birthDate = parsed.data.birth_date?.trim();
  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: uid,
      role: finalRole,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      dni_or_passport: dniOrPassport,
      phone,
      birth_date: birthDate && birthDate.length >= 10 ? birthDate.slice(0, 10) : null,
    },
    { onConflict: "id" },
  );
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
      email: parsed.data.email.toLowerCase(),
      role: finalRole,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      dni_or_passport: dniOrPassport ?? "",
      phone: phone ?? "",
      birth_date: birthDate && birthDate.length >= 10 ? birthDate.slice(0, 10) : null,
    },
    metadata: { provisioning_source: "admin_invite" },
  });
  return { ok: true, userId: uid };
}
