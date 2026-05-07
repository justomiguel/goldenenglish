import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * True if the user may act as section staff: lead `teacher_id`, row in `academic_section_assistants`,
 * or global staff `profiles.role = assistant` on a non-archived section.
 */
export async function userIsSectionTeacherOrAssistant(
  supabase: SupabaseClient,
  userId: string,
  sectionId: string,
): Promise<boolean> {
  const { data: sec, error: sErr } = await supabase
    .from("academic_sections")
    .select("teacher_id, archived_at")
    .eq("id", sectionId)
    .maybeSingle();
  if (sErr || !sec) return false;
  const row = sec as { teacher_id: string; archived_at: string | null };
  if (row.teacher_id === userId) return true;
  const { data: asst, error: aErr } = await supabase
    .from("academic_section_assistants")
    .select("section_id")
    .eq("section_id", sectionId)
    .eq("assistant_id", userId)
    .maybeSingle();
  if (!aErr && asst != null) return true;
  if (row.archived_at != null) return false;
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (pErr || !profile) return false;
  return profile.role === "assistant";
}
