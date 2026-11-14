import type { SupabaseClient } from "@supabase/supabase-js";
import { cohortSectionTeacherNames } from "@/lib/academics/cohortSectionTeacherNames";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const PROFILE_BATCH = 200;

export async function loadCohortSectionTeacherNames(
  supabase: SupabaseClient,
  sections: readonly { id: string; teacherId: string | null }[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (sections.length === 0) return result;

  const sectionIds = sections.map((section) => section.id);
  const [assistantsRes, externalRes] = await Promise.all([
    supabase
      .from("academic_section_assistants")
      .select("section_id, assistant_id")
      .in("section_id", sectionIds),
    supabase
      .from("academic_section_external_assistants")
      .select("section_id, display_name")
      .in("section_id", sectionIds),
  ]);
  if (assistantsRes.error) {
    await logSupabaseClientError("loadCohortSectionTeacherNames:assistants", assistantsRes.error, {
      sectionCount: sectionIds.length,
    });
  }
  if (externalRes.error) {
    await logSupabaseClientError("loadCohortSectionTeacherNames:external", externalRes.error, {
      sectionCount: sectionIds.length,
    });
  }

  const assistantIdsBySection = groupIds(
    assistantsRes.data ?? [],
    "section_id",
    "assistant_id",
  );
  const externalBySection = groupIds(
    externalRes.data ?? [],
    "section_id",
    "display_name",
  );
  const nameById = await loadNames(supabase, profileIds(sections, assistantIdsBySection));

  for (const section of sections) {
    result.set(
      section.id,
      cohortSectionTeacherNames({
        leadId: section.teacherId,
        assistantIds: assistantIdsBySection.get(section.id) ?? [],
        externalNames: externalBySection.get(section.id) ?? [],
        nameById,
      }),
    );
  }
  return result;
}

function groupIds(
  rows: readonly Record<string, unknown>[],
  sectionKey: string,
  valueKey: string,
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const sectionId = String(row[sectionKey] ?? "");
    const value = String(row[valueKey] ?? "");
    if (!sectionId || !value) continue;
    const list = grouped.get(sectionId) ?? [];
    list.push(value);
    grouped.set(sectionId, list);
  }
  return grouped;
}

function profileIds(
  sections: readonly { teacherId: string | null }[],
  assistantIdsBySection: ReadonlyMap<string, string[]>,
): string[] {
  const ids = new Set<string>();
  for (const section of sections) {
    if (section.teacherId) ids.add(section.teacherId);
  }
  for (const assistantIds of assistantIdsBySection.values()) {
    for (const id of assistantIds) ids.add(id);
  }
  return [...ids];
}

async function loadNames(
  supabase: SupabaseClient,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const nameById = new Map<string, string>();
  for (let index = 0; index < ids.length; index += PROFILE_BATCH) {
    const batch = ids.slice(index, index + PROFILE_BATCH);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", batch);
    if (error) {
      await logSupabaseClientError("loadCohortSectionTeacherNames:profiles", error, {
        batchSize: batch.length,
      });
      continue;
    }
    for (const row of data ?? []) {
      const profile = row as { id: string; first_name: string; last_name: string };
      nameById.set(profile.id, formatProfileSnakeSurnameFirst(profile));
    }
  }
  return nameById;
}
