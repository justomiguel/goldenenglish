import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import { normalizeDni } from "@/lib/import/studentImportUtils";
import { parentDefaultEmail } from "@/lib/import/parentDefaultEmail";

function inviteMeta(
  base: Record<string, string>,
  role: "student" | "parent",
): Record<string, unknown> {
  return { ...base, provisioning_source: "admin_invite", role };
}

export async function ensureParentUserId(
  admin: SupabaseClient,
  row: CsvStudentRow,
): Promise<string | null> {
  const raw = row.tutor_dni?.trim();
  if (!raw) return null;
  const { dni, password } = normalizeDni(raw);
  const email = (row.tutor_email?.trim() || parentDefaultEmail(dni)).toLowerCase();
  const meta = inviteMeta(
    {
      first_name: row.tutor_first_name?.trim() || "Tutor",
      last_name: row.tutor_last_name?.trim() || "—",
      dni_or_passport: dni,
      phone: row.tutor_phone?.trim() || "",
      birth_date: "",
    },
    "parent",
  );

  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("dni_or_passport", dni)
    .maybeSingle();

  if (existing?.id) {
    if (existing.role === "parent" || existing.role === "admin") {
      return existing.id as string;
    }
    return null;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error || !created.user) return null;
  return created.user.id;
}

export async function linkParentStudent(
  admin: SupabaseClient,
  parentId: string,
  studentId: string,
) {
  await admin.from("tutor_student_rel").upsert(
    { tutor_id: parentId, student_id: studentId },
    { onConflict: "tutor_id,student_id" },
  );
}

export async function hasPaymentsForYear(
  admin: SupabaseClient,
  studentId: string,
  year: number,
): Promise<boolean> {
  const { data } = await admin
    .from("payments")
    .select("id")
    .eq("student_id", studentId)
    .eq("year", year)
    .limit(1)
    .maybeSingle();
  return data != null;
}

export async function seedPayments2026(
  admin: SupabaseClient,
  studentId: string,
  parentId: string | null,
  amount: number,
): Promise<number> {
  let n = 0;
  const year = 2026;
  for (let month = 1; month <= 12; month++) {
    const { error } = await admin.from("payments").insert({
      parent_id: parentId,
      student_id: studentId,
      month,
      year,
      amount,
      status: "pending",
    });
    if (!error) n += 1;
  }
  return n;
}
