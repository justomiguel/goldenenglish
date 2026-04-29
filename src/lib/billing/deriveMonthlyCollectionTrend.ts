import type { CohortCollectionsMatrixSection } from "@/types/cohortCollectionsMatrix";
import type { FinanceMonthlyTrendPoint } from "@/types/financeAnalytics";
import { periodIndex } from "@/lib/billing/scholarshipPeriod";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function deriveMonthlyCollectionTrend(
  sections: readonly CohortCollectionsMatrixSection[],
  year: number,
  todayMonth: number,
): FinanceMonthlyTrendPoint[] {
  const todayIdx = periodIndex(year, todayMonth);
  const buckets = MONTHS.map((m) => ({
    month: m,
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
    upcoming: 0,
  }));

  for (const sec of sections) {
    for (const stu of sec.view.students) {
      for (const cell of stu.row.cells) {
        if (cell.year !== year) continue;
        const idx = cell.month - 1;
        if (idx < 0 || idx > 11) continue;
        const bucket = buckets[idx]!;
        const expected =
          cell.status === "exempt" ? 0 : (cell.expectedAmount ?? 0);
        const recorded = cell.recordedAmount ?? 0;
        const isInPeriod =
          cell.status !== "out-of-period" &&
          cell.status !== "no-plan" &&
          cell.status !== "exempt";

        if (isInPeriod) bucket.expected += expected;

        switch (cell.status) {
          case "approved":
            bucket.collected += recorded;
            break;
          case "pending":
            bucket.pending += recorded > 0 ? recorded : expected;
            break;
          case "due":
          case "rejected": {
            const cellIdx = periodIndex(cell.year, cell.month);
            if (cellIdx < todayIdx) {
              bucket.overdue += expected;
            } else {
              bucket.upcoming += expected;
            }
            break;
          }
          default:
            break;
        }
      }
    }
  }

  return buckets.map((b) => ({
    ...b,
    expected: round2(b.expected),
    collected: round2(b.collected),
    pending: round2(b.pending),
    overdue: round2(b.overdue),
    upcoming: round2(b.upcoming),
    ratio: b.expected > 0 ? Math.round((b.collected / b.expected) * 1000) / 1000 : 0,
  }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
