import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE = 1000;
const CHUNK = 200;

export type ActiveSectionFact = {
  cohortId: string;
  name: string;
};

type EnrollmentRow = {
  student_id?: unknown;
  academic_sections?: unknown;
};

function readSection(value: unknown): ActiveSectionFact | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const record = row as { name?: unknown; cohort_id?: unknown };
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const cohortId = typeof record.cohort_id === "string" ? record.cohort_id : "";
  if (!name || !cohortId) return null;
  return { cohortId, name };
}

export async function loadSectionCohortById(
  supabase: SupabaseClient,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data as { id?: unknown; cohort_id?: unknown }[]) {
      if (typeof row.id === "string" && typeof row.cohort_id === "string") {
        map.set(row.id, row.cohort_id);
      }
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return map;
}

export async function loadActiveSectionFacts(
  supabase: SupabaseClient,
  studentIds: readonly string[],
): Promise<Map<string, ActiveSectionFact[]>> {
  const ids = [...new Set(studentIds.map((id) => id.trim()).filter(Boolean))];
  const facts = new Map<string, ActiveSectionFact[]>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = ids.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("section_enrollments")
      .select("student_id, academic_sections(name, cohort_id)")
      .eq("status", "active")
      .in("student_id", batch);
    if (error || !data) continue;
    for (const row of data as EnrollmentRow[]) {
      const studentId = typeof row.student_id === "string" ? row.student_id : "";
      const section = readSection(row.academic_sections);
      if (!studentId || !section) continue;
      const list = facts.get(studentId) ?? [];
      list.push(section);
      facts.set(studentId, list);
    }
  }
  return facts;
}

export function activeSectionCohortIds(
  facts: Map<string, ActiveSectionFact[]>,
  studentId: string | null | undefined,
): string[] {
  if (!studentId) return [];
  return [...new Set((facts.get(studentId) ?? []).map((fact) => fact.cohortId))];
}

export function activeSectionNamesInCohort(
  facts: Map<string, ActiveSectionFact[]>,
  studentId: string | null | undefined,
  cohortId: string,
): string[] {
  if (!studentId) return [];
  return (facts.get(studentId) ?? [])
    .filter((fact) => fact.cohortId === cohortId)
    .map((fact) => fact.name);
}
