import type { FinanceMonthlyTrendPoint, FinanceProjection } from "@/types/financeAnalytics";
import type { SectionCollectionsKpis } from "@/types/sectionCollections";

export function computeFinanceProjection(
  trend: readonly FinanceMonthlyTrendPoint[],
  totals: SectionCollectionsKpis,
  todayMonth: number,
): FinanceProjection {
  const elapsedMonths = Math.max(
    1,
    trend.filter((t) => t.month <= todayMonth && t.expected > 0).length,
  );
  const totalCollected = trend
    .filter((t) => t.month <= todayMonth)
    .reduce((sum, t) => sum + t.collected, 0);

  const avgMonthlyCollection = round2(totalCollected / elapsedMonths);
  const monthsRemaining = Math.max(0, 12 - todayMonth);
  const projectedYearEnd = round2(
    totalCollected + avgMonthlyCollection * monthsRemaining,
  );
  const expectedYearEnd = totals.expectedYear;
  const gap = round2(projectedYearEnd - expectedYearEnd);
  const gapPercent =
    expectedYearEnd > 0
      ? Math.round((gap / expectedYearEnd) * 1000) / 1000
      : 0;

  return {
    projectedYearEnd,
    expectedYearEnd,
    gap,
    gapPercent,
    monthsRemaining,
    avgMonthlyCollection,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
