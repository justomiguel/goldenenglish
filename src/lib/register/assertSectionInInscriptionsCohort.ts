import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { resolveRegistrationCohortState } from "@/lib/settings/inscriptionsServer";

export function sectionBelongsToInscriptionsCohort(
  sectionCohortId: string | null | undefined,
  inscriptionsCohortId: string | null | undefined,
): boolean {
  if (!sectionCohortId || !inscriptionsCohortId) return false;
  return sectionCohortId === inscriptionsCohortId;
}

type CohortRow = { id: string; name: string | null; is_current: boolean | null };

export async function assertSectionInInscriptionsCohort(
  admin: SupabaseClient,
  sectionId: string,
): Promise<{ ok: true } | { ok: false; code: "section_cohort_mismatch" }> {
  const [{ data: section }, { data: settingRow }, { data: cohortRows }] = await Promise.all([
    admin
      .from("academic_sections")
      .select("cohort_id")
      .eq("id", sectionId)
      .is("archived_at", null)
      .maybeSingle(),
    admin.from("site_settings").select("value").eq("key", "registration_cohort_id").maybeSingle(),
    admin
      .from("academic_cohorts")
      .select("id, name, is_current")
      .is("archived_at", null)
      .order("name", { ascending: true }),
  ]);

  const cohorts = ((cohortRows ?? []) as CohortRow[]).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    isCurrent: row.is_current === true,
  }));
  const activeId =
    resolveRegistrationCohortState(cohorts, settingRow?.value ?? null).activeCohort?.id ?? null;
  const rawCohort = section ? (section as { cohort_id?: unknown }).cohort_id : null;
  const sectionCohortId = typeof rawCohort === "string" ? rawCohort : null;
  if (!sectionBelongsToInscriptionsCohort(sectionCohortId, activeId)) {
    logServerWarn("registrations.sectionCohort", {
      code: "section_cohort_mismatch",
      sectionId,
    });
    return { ok: false, code: "section_cohort_mismatch" };
  }
  return { ok: true };
}
