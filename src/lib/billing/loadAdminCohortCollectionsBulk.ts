import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCohortCollectionsMatrix,
  type BuildCohortCollectionsMatrixOptions,
} from "@/lib/billing/buildCohortCollectionsMatrix";
import { buildCohortCollectionsMatrixFromViews } from "@/lib/billing/buildCohortCollectionsMatrixFromViews";
import { loadAdminSectionCollectionsView } from "@/lib/billing/loadAdminSectionCollectionsView";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type {
  CohortCollectionsBulkRaw,
  CohortCollectionsMatrix,
} from "@/types/cohortCollectionsMatrix";

const MAX_SECTIONS_PER_COHORT_MATRIX = 80;

interface CohortRow {
  id: string;
  name: string;
}

interface SectionRow {
  id: string;
  name: string;
  archived_at: string | null;
}

async function loadFallbackMatrix(
  supabase: SupabaseClient,
  cohortId: string,
  opts: BuildCohortCollectionsMatrixOptions,
): Promise<CohortCollectionsMatrix | null> {
  const { data: cohortData, error: cohortError } = await supabase
    .from("academic_cohorts")
    .select("id, name")
    .eq("id", cohortId)
    .maybeSingle();
  if (cohortError || !cohortData) {
    if (cohortError) logSupabaseClientError("loadAdminCohortCollectionsBulk:fallbackCohort", cohortError);
    return null;
  }

  const { data: sectionData, error: sectionError } = await supabase
    .from("academic_sections")
    .select("id, name, archived_at")
    .eq("cohort_id", cohortId)
    .is("archived_at", null)
    .order("name", { ascending: true })
    .limit(MAX_SECTIONS_PER_COHORT_MATRIX);
  if (sectionError) {
    logSupabaseClientError("loadAdminCohortCollectionsBulk:fallbackSections", sectionError, { cohortId });
    return null;
  }

  const cohort = cohortData as CohortRow;
  const sections = (sectionData ?? []) as SectionRow[];
  if (sections.length === 0) {
    return buildCohortCollectionsMatrixFromViews({
      cohortId: cohort.id,
      cohortName: cohort.name,
      year: opts.todayYear,
      todayMonth: opts.todayMonth,
      sections: [],
    });
  }

  const views = await Promise.all(
    sections.map(async (section) => {
      const view = await loadAdminSectionCollectionsView(supabase, section.id, opts);
      return view ? { view, archivedAt: section.archived_at } : null;
    }),
  );

  return buildCohortCollectionsMatrixFromViews({
    cohortId: cohort.id,
    cohortName: cohort.name,
    year: opts.todayYear,
    todayMonth: opts.todayMonth,
    sections: views.filter((v): v is NonNullable<typeof v> => v != null),
  });
}

/**
 * Bulk loader for the cohort collections matrix used by the
 * `/admin/finance` overview tab.
 *
 * Issues a single Postgres RPC (`admin_cohort_collections_bulk`) that
 * returns all raw rows needed (sections, enrollments, profiles, payments,
 * scholarships, fee plans) and composes the final matrix in the application
 * layer reusing the existing pure billing reducers.
 *
 * Replaces the N+1 pattern of `loadAdminCohortCollectionsOverview` for the
 * grid-style overview. The legacy KPI-only summary is still served by the
 * existing loader for the `collections` tab.
 */
export async function loadAdminCohortCollectionsBulk(
  supabase: SupabaseClient,
  cohortId: string,
  opts: BuildCohortCollectionsMatrixOptions,
): Promise<CohortCollectionsMatrix | null> {
  const { data, error } = await supabase.rpc("admin_cohort_collections_bulk", {
    p_cohort_id: cohortId,
    p_year: opts.todayYear,
  });
  if (error || !data) {
    if (error) logSupabaseClientError("loadAdminCohortCollectionsBulk:rpc", error, { cohortId });
    return loadFallbackMatrix(supabase, cohortId, opts);
  }
  const raw = data as CohortCollectionsBulkRaw;
  return buildCohortCollectionsMatrix(raw, opts);
}
