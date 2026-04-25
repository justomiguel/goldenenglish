import {
  SECTION_COLLECTIONS_HEALTH_THRESHOLDS,
  type SectionCollectionsHealth,
  type SectionCollectionsKpis,
} from "@/types/sectionCollections";
import type { CohortCollectionsMatrixSection } from "@/types/cohortCollectionsMatrix";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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

export function aggregateCohortCollectionsTotals(
  sections: readonly CohortCollectionsMatrixSection[],
): SectionCollectionsKpis {
  let paid = 0;
  let pendingReview = 0;
  let overdue = 0;
  let upcoming = 0;
  let expectedYear = 0;
  let totalStudents = 0;
  let overdueStudents = 0;
  for (const s of sections) {
    paid += s.view.kpis.paid;
    pendingReview += s.view.kpis.pendingReview;
    overdue += s.view.kpis.overdue;
    upcoming += s.view.kpis.upcoming;
    expectedYear += s.view.kpis.expectedYear;
    totalStudents += s.view.kpis.totalStudents;
    overdueStudents += s.view.kpis.overdueStudents;
  }
  const collectionRatio = expectedYear > 0 ? Math.min(1, paid / expectedYear) : 0;
  return {
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    expectedYear: round2(expectedYear),
    collectionRatio: Math.round(collectionRatio * 1000) / 1000,
    totalStudents,
    overdueStudents,
    health: deriveOverallHealth(
      collectionRatio,
      overdueStudents,
      totalStudents,
      expectedYear,
    ),
  };
}
