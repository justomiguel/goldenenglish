import type { SupabaseClient } from "@supabase/supabase-js";
import type { CefrLevel, CsvStudentRow } from "@/lib/import/studentRowSchema";
import { cefrLevelEnum } from "@/lib/import/studentRowSchema";

export const DEFAULT_ACADEMIC_YEAR = 2026;

export function parseCefrLevelFromInterest(
  raw: string | null | undefined,
): CefrLevel | null {
  const t = raw?.trim().toUpperCase() ?? "";
  const p = cefrLevelEnum.safeParse(t);
  return p.success ? p.data : null;
}

export async function resolveCourseId(
  admin: SupabaseClient,
  row: CsvStudentRow,
): Promise<string | null> {
  if (!row.level) return null;
  const year = row.academic_year ?? DEFAULT_ACADEMIC_YEAR;
  const { data, error } = await admin
    .from("courses")
    .select("id")
    .eq("level", row.level)
    .eq("academic_year", year)
    .eq("modality", "online")
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function resolveCourseIdFromLevelInterest(
  admin: SupabaseClient,
  levelInterest: string | null | undefined,
  academicYear: number = DEFAULT_ACADEMIC_YEAR,
): Promise<string | null> {
  const level = parseCefrLevelFromInterest(levelInterest);
  if (!level) return null;
  const { data, error } = await admin
    .from("courses")
    .select("id")
    .eq("level", level)
    .eq("academic_year", academicYear)
    .eq("modality", "online")
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function enrollmentExists(
  admin: SupabaseClient,
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();
  return data != null;
}

export async function insertEnrollmentIfMissing(
  admin: SupabaseClient,
  studentId: string,
  courseId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (await enrollmentExists(admin, studentId, courseId)) {
    return { ok: true };
  }
  const { error } = await admin.from("enrollments").insert({
    student_id: studentId,
    course_id: courseId,
  });
  if (error) return { ok: false, message: "enrollment_failed" };
  return { ok: true };
}
