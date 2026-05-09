import { describe, expect, it } from "vitest";
import {
  annualSettlementPeriodIndicesForYear,
  annualSettlementRangesOverlap,
  calendarYearAnnualSettlementCoverage,
  periodInAnnualSettlementCoverage,
} from "@/lib/billing/annualSettlementPeriod";

describe("annualSettlementPeriod", () => {
  it("calendarYearAnnualSettlementCoverage spans Jan–Dec", () => {
    const y = 2027;
    const c = calendarYearAnnualSettlementCoverage(y);
    expect(periodInAnnualSettlementCoverage(y, 1, c)).toBe(true);
    expect(periodInAnnualSettlementCoverage(y, 12, c)).toBe(true);
    expect(periodInAnnualSettlementCoverage(y - 1, 12, c)).toBe(false);
  });

  it("detects overlapping settlement ranges", () => {
    const a = calendarYearAnnualSettlementCoverage(2026);
    const b = { ...calendarYearAnnualSettlementCoverage(2025) };
    expect(annualSettlementRangesOverlap(a, calendarYearAnnualSettlementCoverage(2026))).toBe(true);
    expect(annualSettlementRangesOverlap(a, b)).toBe(false);
  });

  it("annualSettlementPeriodIndicesForYear lists covered months only", () => {
    const rows = [
      {
        coverage_from_year: 2026,
        coverage_from_month: 3,
        coverage_until_year: 2026,
        coverage_until_month: 5,
      },
    ];
    const s = annualSettlementPeriodIndicesForYear(rows, 2026);
    expect(s.size).toBe(3);
  });
});
