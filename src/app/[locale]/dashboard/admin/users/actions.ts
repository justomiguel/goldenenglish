"use server";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { z } from "zod";

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
});

export async function createDashboardUser(
  raw: z.infer<typeof createUserSchema>,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, message: "Forbidden" };
  }

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Invalid data" };

  const pwd = parsed.data.password.trim();
  if (pwd.length > 0 && pwd.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters or left empty" };
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

  if (error) return { ok: false, message: error.message };
  if (!created.user) return { ok: false, message: "No user returned" };
  return { ok: true };
}
