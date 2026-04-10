"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { z } from "zod";

const roleZ = z.enum(["admin", "teacher", "student", "parent"]);

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
  role: roleZ,
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni_or_passport: z.string().trim().min(1).max(32),
  phone: z.string().trim().max(40).optional(),
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

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      dni_or_passport: parsed.data.dni_or_passport,
      phone: parsed.data.phone ?? "",
      provisioning_source: "admin_invite",
      role: parsed.data.role,
    },
  });

  if (error) return { ok: false, message: error.message };
  if (!created.user) return { ok: false, message: "No user returned" };
  return { ok: true };
}
