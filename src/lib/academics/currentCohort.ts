import type { SupabaseClient } from "@supabase/supabase-js";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";

export type CurrentCohort = {
  id: string;
  name: string;
  slug: string | null;
  starts_on: string | null;
  ends_on: string | null;
};

export type CurrentCohortSection = {
  id: string;
  name: string;
  teacherName: string;
  activeCount: number;
  maxStudents: number;
};

export async function loadCurrentCohort(
  supabase: SupabaseClient,
): Promise<CurrentCohort | null> {
  const { data, error } = await supabase
    .from("academic_cohorts")
    .select("id, name, slug, starts_on, ends_on")
    .eq("is_current", true)
    .is("archived_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return data as CurrentCohort;
}

export async function loadCurrentCohortSections(
  supabase: SupabaseClient,
): Promise<CurrentCohortSection[]> {
  const cohort = await loadCurrentCohort(supabase);
  if (!cohort) return [];

  const defaultMax = getDefaultSectionMaxStudents();

  const { data: sections } = await supabase
    .from("academic_sections")
    .select("id, name, max_students, profiles(first_name, last_name)")
    .eq("cohort_id", cohort.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (!sections?.length) return [];

  type SectionRow = {
    id: string;
    name: string;
    max_students: number | null;
    profiles:
      | { first_name: string; last_name: string }
      | { first_name: string; last_name: string }[]
      | null;
  };

  const ids = sections.map((s) => (s as SectionRow).id);
  const { data: counts } = await supabase
    .from("section_enrollments")
    .select("section_id")
    .in("section_id", ids)
    .eq("status", "active");

  const countMap = new Map<string, number>();
  for (const c of (counts ?? []) as { section_id: string }[]) {
    countMap.set(c.section_id, (countMap.get(c.section_id) ?? 0) + 1);
  }

  return (sections as SectionRow[]).map((s) => {
    const pRaw = s.profiles;
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    return {
      id: s.id,
      name: s.name,
      teacherName: p ? `${p.first_name} ${p.last_name}`.trim() : "—",
      activeCount: countMap.get(s.id) ?? 0,
      maxStudents: s.max_students ?? defaultMax,
    };
  });
}
