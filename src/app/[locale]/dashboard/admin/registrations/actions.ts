"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";

const idZ = z.string().uuid();

const acceptSchema = z.object({
  registration_id: idZ,
  password: z.string().max(72).optional(),
  birth_date: z
    .string()
    .trim()
    .optional()
    .refine((s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s), { message: "Invalid date" }),
});

export async function deleteRegistration(
  locale: string,
  registrationId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, message: "Forbidden" };
  }

  const parsed = idZ.safeParse(registrationId);
  if (!parsed.success) return { ok: false, message: "Invalid id" };

  const admin = createAdminClient();
  const { error } = await admin.from("registrations").delete().eq("id", parsed.data);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}

export async function acceptRegistration(
  locale: string,
  raw: z.infer<typeof acceptSchema>,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, message: "Forbidden" };
  }

  const parsed = acceptSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Invalid data" };

  const admin = createAdminClient();
  const { data: reg, error: fetchErr } = await admin
    .from("registrations")
    .select("id,status,first_name,last_name,dni,email,phone,birth_date")
    .eq("id", parsed.data.registration_id)
    .maybeSingle();

  if (fetchErr || !reg) return { ok: false, message: "Not found" };
  if (reg.status !== "new") return { ok: false, message: "already_processed" };

  const pwd = parsed.data.password?.trim() ?? "";
  const birthFromForm = parsed.data.birth_date?.trim();
  const birthFromReg =
    reg.birth_date != null && String(reg.birth_date).trim() !== ""
      ? String(reg.birth_date).trim().slice(0, 10)
      : undefined;
  const birth = birthFromForm || birthFromReg;

  const phone = (reg.phone != null ? String(reg.phone).trim() : "") || "—";

  const createRes = await createDashboardUser({
    email: String(reg.email),
    password: pwd,
    role: "student",
    first_name: String(reg.first_name),
    last_name: String(reg.last_name),
    dni_or_passport: String(reg.dni),
    phone,
    birth_date: birth,
  });

  if (!createRes.ok) return createRes;

  const { error: upErr } = await admin
    .from("registrations")
    .update({ status: "enrolled" })
    .eq("id", reg.id);

  if (upErr) return { ok: false, message: upErr.message };

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}
