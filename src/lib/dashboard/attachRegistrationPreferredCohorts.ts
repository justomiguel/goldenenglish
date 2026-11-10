import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { cohortIdBySection } from "@/lib/register/registrationMatriculaAlta";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

export async function attachRegistrationPreferredCohorts(
  supabase: SupabaseClient,
  rows: AdminRegistrationRow[],
): Promise<AdminRegistrationRow[]> {
  const preferredIds = rows
    .map((row) => row.preferred_section_id)
    .filter((id): id is string => Boolean(id));
  if (preferredIds.length === 0) return rows;
  const { data, error } = await supabase
    .from("academic_sections")
    .select("id, cohort_id")
    .in("id", preferredIds);
  if (error) {
    logSupabaseClientError("attachRegistrationPreferredCohorts", error, {});
    return rows;
  }
  const cohortBySection = cohortIdBySection(
    (data ?? []) as { id?: unknown; cohort_id?: unknown }[],
  );
  return rows.map((row) => ({
    ...row,
    preferredSectionCohortId: row.preferred_section_id
      ? (cohortBySection.get(row.preferred_section_id) ?? null)
      : null,
  }));
}
