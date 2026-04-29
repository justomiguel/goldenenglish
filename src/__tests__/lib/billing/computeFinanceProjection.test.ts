import { describe, expect, it } from "vitest";
import { computeFinanceProjection } from "@/lib/billing/computeFinanceProjection";
import type { FinanceMonthlyTrendPoint } from "@/types/financeAnalytics";
import type { SectionCollectionsKpis } from "@/types/sectionCollections";

function makeTrend(monthData: { month: number; collected: number; expected: number }[]): FinanceMonthlyTrendPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const entry = monthData.find((d) => d.month === m);
    return {
      month: m,
      expected: entry?.expected ?? 0,
      collected: entry?.collected ?? 0,
      pending: 0,
      overdue: 0,
      upcoming: 0,
      ratio: entry ? (entry.expected > 0 ? entry.collected / entry.expected : 0) : 0,
    };
  });
}

const baseTotals: SectionCollectionsKpis = {
  paid: 0,
  pendingReview: 0,
  overdue: 0,
  upcoming: 0,
  expectedYear: 1200,
  collectionRatio: 0,
  totalStudents: 10,
  overdueStudents: 0,
  health: "healthy",
};

describe("computeFinanceProjection", () => {
  it("projects year-end based on average monthly collection", () => {
    const trend = makeTrend([
      { month: 1, collected: 100, expected: 100 },
      { month: 2, collected: 100, expected: 100 },
      { month: 3, collected: 100, expected: 100 },
    ]);
    const result = computeFinanceProjection(trend, baseTotals, 3);
    expect(result.avgMonthlyCollection).toBe(100);
    expect(result.monthsRemaining).toBe(9);
    expect(result.projectedYearEnd).toBe(1200);
    expect(result.gap).toBe(0);
  });

  it("detects behind-target when collection pace is low", () => {
    const trend = makeTrend([
      { month: 1, collected: 50, expected: 100 },
      { month: 2, collected: 50, expected: 100 },
    ]);
    const result = computeFinanceProjection(trend, baseTotals, 2);
    expect(result.avgMonthlyCollection).toBe(50);
    expect(result.projectedYearEnd).toBe(600);
    expect(result.gap).toBe(-600);
    expect(result.gapPercent).toBe(-0.5);
  });

  it("handles zero expected year gracefully", () => {
    const trend = makeTrend([]);
    const totals = { ...baseTotals, expectedYear: 0 };
    const result = computeFinanceProjection(trend, totals, 6);
    expect(result.gapPercent).toBe(0);
  });

  it("returns 0 months remaining at December", () => {
    const trend = makeTrend([
      { month: 1, collected: 100, expected: 100 },
    ]);
    const result = computeFinanceProjection(trend, baseTotals, 12);
    expect(result.monthsRemaining).toBe(0);
  });

  it("detects ahead-of-target when collection pace is high", () => {
    const trend = makeTrend([
      { month: 1, collected: 200, expected: 100 },
      { month: 2, collected: 200, expected: 100 },
    ]);
    const result = computeFinanceProjection(trend, baseTotals, 2);
    expect(result.gap).toBeGreaterThan(0);
    expect(result.gapPercent).toBeGreaterThan(0);
  });
});
