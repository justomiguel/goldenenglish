import type { SupabaseClient } from "@supabase/supabase-js";

/** True if the user is the section lead (`teacher_id`) or an assistant row exists. */
export async function userIsSectionTeacherOrAssistant(
  supabase: SupabaseClient,
  userId: string,
  sectionId: string,
): Promise<boolean> {
  const { data: sec, error: sErr } = await supabase
    .from("academic_sections")
    .select("teacher_id")
    .eq("id", sectionId)
    .maybeSingle();
  if (sErr || !sec) return false;
  if ((sec as { teacher_id: string }).teacher_id === userId) return true;
  const { data: asst, error: aErr } = await supabase
    .from("academic_section_assistants")
    .select("section_id")
    .eq("section_id", sectionId)
    .eq("assistant_id", userId)
    .maybeSingle();
  if (aErr) return false;
  return asst != null;
}
