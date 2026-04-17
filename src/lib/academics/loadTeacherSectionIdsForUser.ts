import type { SupabaseClient } from "@supabase/supabase-js";

/** Section IDs where `userId` is lead teacher or listed as assistant (bounded per query). */
export async function loadTeacherSectionIdsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const [{ data: lead }, { data: asst, error: asstErr }] = await Promise.all([
    supabase.from("academic_sections").select("id").eq("teacher_id", userId).limit(500),
    supabase.from("academic_section_assistants").select("section_id").eq("assistant_id", userId).limit(500),
  ]);
  const out = new Set<string>();
  for (const r of lead ?? []) out.add((r as { id: string }).id);
  if (!asstErr) {
    for (const r of asst ?? []) out.add((r as { section_id: string }).section_id);
  }
  return [...out];
}
