import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCohortCollectionsMatrix,
  type BuildCohortCollectionsMatrixOptions,
} from "@/lib/billing/buildCohortCollectionsMatrix";
import type {
  CohortCollectionsBulkRaw,
  CohortCollectionsMatrix,
} from "@/types/cohortCollectionsMatrix";

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
  if (error || !data) return null;
  const raw = data as CohortCollectionsBulkRaw;
  return buildCohortCollectionsMatrix(raw, opts);
}
