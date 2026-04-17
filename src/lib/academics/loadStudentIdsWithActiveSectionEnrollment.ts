import type { SupabaseClient } from "@supabase/supabase-js";

const CHUNK_SIZE = 200;

/** Student IDs that have at least one `active` row in `section_enrollments`. */
export async function loadStudentIdsWithActiveSectionEnrollment(
  admin: SupabaseClient,
  studentIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(studentIds.filter((id) => id.trim().length > 0))];
  if (ids.length === 0) return new Set();

  const result = new Set<string>();

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const batch = ids.slice(i, i + CHUNK_SIZE);
    const { data } = await admin
      .from("section_enrollments")
      .select("student_id")
      .in("student_id", batch)
      .eq("status", "active");

    if (data) {
      for (const r of data as { student_id: string }[]) {
        result.add(String(r.student_id));
      }
    }
  }

  return result;
}
