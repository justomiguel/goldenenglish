import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";

export async function resolveCourseId(
  admin: SupabaseClient,
  row: CsvStudentRow,
): Promise<string | null> {
  if (!row.level) return null;
  const year = row.academic_year ?? 2026;
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
