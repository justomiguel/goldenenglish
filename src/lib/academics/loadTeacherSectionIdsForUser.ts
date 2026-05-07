import type { SupabaseClient } from "@supabase/supabase-js";

const SECTION_LIST_CAP = 500;

/**
 * Section IDs where `userId` is lead teacher, listed as section assistant, or (profile role
 * `assistant`) any non-archived section for institute-wide attendance staff.
 */
export async function loadTeacherSectionIdsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!pErr && profile?.role === "assistant") {
    const { data: rows, error } = await supabase
      .from("academic_sections")
      .select("id")
      .is("archived_at", null)
      .order("name", { ascending: true })
      .limit(SECTION_LIST_CAP);
    if (error) return [];
    return (rows ?? []).map((r) => (r as { id: string }).id);
  }

  const [{ data: lead }, { data: asst, error: asstErr }] = await Promise.all([
    supabase.from("academic_sections").select("id").eq("teacher_id", userId).limit(SECTION_LIST_CAP),
    supabase
      .from("academic_section_assistants")
      .select("section_id")
      .eq("assistant_id", userId)
      .limit(SECTION_LIST_CAP),
  ]);
  const out = new Set<string>();
  for (const r of lead ?? []) out.add((r as { id: string }).id);
  if (!asstErr) {
    for (const r of asst ?? []) out.add((r as { section_id: string }).section_id);
  }
  return [...out];
}
