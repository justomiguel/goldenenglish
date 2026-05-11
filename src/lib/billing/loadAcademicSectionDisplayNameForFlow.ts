import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadAcademicSectionDisplayNameForFlow(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<string | null> {
  const { data } = await supabase.from("academic_sections").select("name").eq("id", sectionId).maybeSingle();
  const n = typeof data?.name === "string" ? data.name.trim() : "";
  return n.length > 0 ? n : null;
}
