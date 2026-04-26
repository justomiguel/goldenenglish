import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentSectionOption } from "@/types/learningContent";

type SectionRow = {
  id: string;
  name: string;
  academic_cohorts: { name: string } | { name: string }[] | null;
};

function cohortName(raw: SectionRow["academic_cohorts"]): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

export async function loadContentSections(
  supabase: SupabaseClient,
  limit = 80,
): Promise<ContentSectionOption[]> {
  const { data } = await supabase
    .from("academic_sections")
    .select("id, name, academic_cohorts(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as SectionRow[]).map((row) => {
    const cohort = cohortName(row.academic_cohorts);
    return {
      id: row.id,
      label: cohort ? `${cohort} - ${row.name}` : row.name,
      cohortName: cohort,
    };
  });
}
