import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import type { TutorDisplayDefaults } from "@/lib/register/tutorDisplayNameParts";
import { ensureParentProfileByTutorDni, upsertTutorStudentLink } from "@/lib/register/ensureParentProfileByTutorDni";

export async function ensureParentUserId(
  admin: SupabaseClient,
  row: CsvStudentRow,
  tutorDefaults: TutorDisplayDefaults,
): Promise<string | null> {
  const raw = row.tutor_dni?.trim();
  if (!raw) return null;
  const r = await ensureParentProfileByTutorDni(admin, {
    tutorDniRaw: raw,
    tutorEmail: row.tutor_email,
    tutorPhone: row.tutor_phone,
    tutorFirstName: row.tutor_first_name?.trim() || tutorDefaults.defaultFirstName,
    tutorLastName: row.tutor_last_name?.trim() || tutorDefaults.emptyLastName,
  });
  return r.ok ? r.parentId : null;
}

export async function linkParentStudent(
  admin: SupabaseClient,
  parentId: string,
  studentId: string,
) {
  await upsertTutorStudentLink(admin, parentId, studentId, null);
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
