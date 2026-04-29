import type { CohortCollectionsMatrixSection } from "@/types/cohortCollectionsMatrix";
import type { FinanceSectionRanked } from "@/types/financeAnalytics";

const HEALTH_ORDER: Record<string, number> = {
  critical: 0,
  watch: 1,
  healthy: 2,
};

export function rankSectionsByHealth(
  sections: readonly CohortCollectionsMatrixSection[],
): FinanceSectionRanked[] {
  const totalExpected = sections.reduce(
    (s, sec) => s + sec.view.kpis.expectedYear,
    0,
  );
  const totalPaid = sections.reduce((s, sec) => s + sec.view.kpis.paid, 0);
  const avgRatio = totalExpected > 0 ? totalPaid / totalExpected : 0;

  return sections
    .map((sec) => ({
      sectionId: sec.view.sectionId,
      sectionName: sec.view.sectionName,
      health: sec.view.kpis.health,
      collectionRatio: sec.view.kpis.collectionRatio,
      deltaFromAvg: Math.round((sec.view.kpis.collectionRatio - avgRatio) * 1000) / 1000,
      overdueStudents: sec.view.kpis.overdueStudents,
      overdueAmount: sec.view.kpis.overdue,
      totalStudents: sec.view.kpis.totalStudents,
    }))
    .sort(
      (a, b) =>
        (HEALTH_ORDER[a.health] ?? 1) - (HEALTH_ORDER[b.health] ?? 1) ||
        a.collectionRatio - b.collectionRatio,
    );
}
