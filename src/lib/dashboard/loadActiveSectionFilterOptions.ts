import type { SupabaseClient } from "@supabase/supabase-js";

export type ParentSectionFilterOption = { id: string; name: string };

export async function loadActiveSectionFilterOptions(
  admin: SupabaseClient,
): Promise<ParentSectionFilterOption[]> {
  const { data } = await admin
    .from("academic_sections")
    .select("id, name")
    .is("archived_at", null)
    .order("name", { ascending: true })
    .limit(200);
  return (data ?? []).map((row) => ({
    id: String((row as { id: string }).id),
    name: String((row as { name: string | null }).name ?? "").trim() || String((row as { id: string }).id),
  }));
}
