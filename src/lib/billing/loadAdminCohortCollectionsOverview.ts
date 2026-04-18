import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminSectionCollectionsView } from "@/lib/billing/loadAdminSectionCollectionsView";
import { toCohortCollectionsSectionSummary } from "@/lib/billing/buildSectionCollectionsView";
import {
  SECTION_COLLECTIONS_HEALTH_THRESHOLDS,
  type CohortCollectionsOverview,
  type CohortCollectionsSectionSummary,
  type SectionCollectionsHealth,
  type SectionCollectionsKpis,
} from "@/types/sectionCollections";

/**
 * Hard cap on the number of sections we summarize in a single cohort overview.
 * Beyond this we'd need an aggregated SQL RPC; logged as ADR follow-up.
 */
const MAX_SECTIONS_PER_COHORT = 80;

export interface LoadAdminCohortCollectionsOptions {
  todayYear: number;
  todayMonth: number;
  /** When true, archived sections are included in the overview. */
  includeArchived?: boolean;
}

interface CohortRow {
  id: string;
  name: string;
}

interface SectionRow {
  id: string;
  name: string;
  archived_at: string | null;
}

function deriveOverallHealth(
  collectionRatio: number,
  overdueStudents: number,
  totalStudents: number,
  expectedYear: number,
): SectionCollectionsHealth {
  if (totalStudents === 0 || expectedYear === 0) return "watch";
  const t = SECTION_COLLECTIONS_HEALTH_THRESHOLDS;
  const overdueShare = overdueStudents / totalStudents;
  if (
    collectionRatio < t.criticalMaxRatio ||
    overdueShare >= t.watchOverdueShare
  ) {
    return "critical";
  }
  if (collectionRatio >= t.healthyMinRatio && overdueStudents === 0) {
    return "healthy";
  }
  return "watch";
}

function aggregateTotals(
  sections: readonly CohortCollectionsSectionSummary[],
): SectionCollectionsKpis {
  let paid = 0;
  let pendingReview = 0;
  let overdue = 0;
  let upcoming = 0;
  let expectedYear = 0;
  let totalStudents = 0;
  let overdueStudents = 0;
  for (const s of sections) {
    paid += s.kpis.paid;
    pendingReview += s.kpis.pendingReview;
    overdue += s.kpis.overdue;
    upcoming += s.kpis.upcoming;
    expectedYear += s.kpis.expectedYear;
    totalStudents += s.kpis.totalStudents;
    overdueStudents += s.kpis.overdueStudents;
  }
  const collectionRatio = expectedYear > 0 ? Math.min(1, paid / expectedYear) : 0;
  const health = deriveOverallHealth(
    collectionRatio,
    overdueStudents,
    totalStudents,
    expectedYear,
  );
  return {
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    expectedYear: round2(expectedYear),
    collectionRatio: Math.round(collectionRatio * 1000) / 1000,
    totalStudents,
    overdueStudents,
    health,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function loadAdminCohortCollectionsOverview(
  supabase: SupabaseClient,
  cohortId: string,
  opts: LoadAdminCohortCollectionsOptions,
): Promise<CohortCollectionsOverview | null> {
  const { data: cohortData } = await supabase
    .from("academic_cohorts")
    .select("id, name")
    .eq("id", cohortId)
    .maybeSingle();
  if (!cohortData) return null;
  const cohort = cohortData as CohortRow;

  const sectionsQuery = supabase
    .from("academic_sections")
    .select("id, name, archived_at")
    .eq("cohort_id", cohortId)
    .order("name", { ascending: true })
    .limit(MAX_SECTIONS_PER_COHORT);
  const sectionsRes = opts.includeArchived
    ? await sectionsQuery
    : await sectionsQuery.is("archived_at", null);
  const sectionRows = (sectionsRes.data ?? []) as SectionRow[];

  if (sectionRows.length === 0) {
    return {
      cohortId: cohort.id,
      cohortName: cohort.name,
      year: opts.todayYear,
      sections: [],
      totals: aggregateTotals([]),
    };
  }

  const summaries = await Promise.all(
    sectionRows.map(async (s) => {
      const view = await loadAdminSectionCollectionsView(supabase, s.id, {
        todayYear: opts.todayYear,
        todayMonth: opts.todayMonth,
      });
      if (!view) return null;
      return toCohortCollectionsSectionSummary(view, s.archived_at);
    }),
  );

  const sections = summaries.filter(
    (x): x is CohortCollectionsSectionSummary => x != null,
  );

  return {
    cohortId: cohort.id,
    cohortName: cohort.name,
    year: opts.todayYear,
    sections,
    totals: aggregateTotals(sections),
  };
}

export const __INTERNAL_MAX_SECTIONS_PER_COHORT = MAX_SECTIONS_PER_COHORT;
