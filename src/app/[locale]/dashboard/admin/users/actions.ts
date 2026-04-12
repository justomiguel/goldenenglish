"use server";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { z } from "zod";
import { getDictionary, defaultLocale } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/types/i18n";

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
    default:
      return U.errCreateAuth;
  }
}

const roleZ = z.enum(["admin", "teacher", "student", "parent"]);

function generateTempPassword(): string {
  return randomBytes(24).toString("base64url");
}

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().max(72),
  role: roleZ.optional(),
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni_or_passport: z.string().trim().min(1).max(32),
  phone: z.string().trim().min(1).max(40),
  birth_date: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ),
  locale: z.string().min(2).max(8).optional(),
});

export async function createDashboardUser(
  raw: z.infer<typeof createUserSchema>,
): Promise<{ ok: boolean; message?: string; userId?: string }> {
  try {
    await assertAdmin();
  } catch {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: localizeCreateDashboardUserError(dict, "forbidden") };
  }

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: localizeCreateDashboardUserError(dict, "invalid_data") };
  }

  const dict = await getDictionary(parsed.data.locale ?? defaultLocale);
  const pwd = parsed.data.password.trim();
  if (pwd.length > 0 && pwd.length < 6) {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "password_policy") };
  }
  const finalPassword = pwd.length >= 6 ? pwd : generateTempPassword();
  const finalRole = parsed.data.role ?? "student";

  const admin = createAdminClient();
  const meta: Record<string, string> = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    dni_or_passport: parsed.data.dni_or_passport,
    phone: parsed.data.phone,
    provisioning_source: "admin_invite",
    role: finalRole,
  };
  const bd = parsed.data.birth_date?.trim();
  if (bd) meta.birth_date = bd;

  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: finalPassword,
    email_confirm: true,
    user_metadata: meta,
  });

  if (error) return { ok: false, message: localizeCreateDashboardUserError(dict, "auth_failed") };
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
      dni_or_passport: parsed.data.dni_or_passport.trim(),
      phone: parsed.data.phone,
      birth_date: birthDate && birthDate.length >= 10 ? birthDate.slice(0, 10) : null,
    },
    { onConflict: "id" },
  );
  if (profileErr) {
    return { ok: false, message: localizeCreateDashboardUserError(dict, "auth_failed") };
  }

  return { ok: true, userId: uid };
}
