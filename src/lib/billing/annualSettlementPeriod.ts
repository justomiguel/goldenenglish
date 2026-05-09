import { periodIndex } from "@/lib/billing/scholarshipPeriod";

export type AnnualSettlementCoverageRow = {
  coverage_from_year: number;
  coverage_from_month: number;
  coverage_until_year: number;
  coverage_until_month: number;
};

export function periodInAnnualSettlementCoverage(
  year: number,
  month: number,
  row: AnnualSettlementCoverageRow,
): boolean {
  const p = periodIndex(year, month);
  const from = periodIndex(row.coverage_from_year, row.coverage_from_month);
  const until = periodIndex(row.coverage_until_year, row.coverage_until_month);
  return p >= from && p <= until;
}

/** Expands inclusive coverage into `periodIndex` values (for matrix / row builders). */
export function buildAnnualSettlementCoverageIndexSet(
  rows: readonly AnnualSettlementCoverageRow[],
): Set<number> {
  const set = new Set<number>();
  for (const row of rows) {
    const from = periodIndex(row.coverage_from_year, row.coverage_from_month);
    const until = periodIndex(row.coverage_until_year, row.coverage_until_month);
    for (let idx = from; idx <= until; idx++) {
      set.add(idx);
    }
  }
  return set;
}

export function calendarYearAnnualSettlementCoverage(year: number): AnnualSettlementCoverageRow {
  return {
    coverage_from_year: year,
    coverage_from_month: 1,
    coverage_until_year: year,
    coverage_until_month: 12,
  };
}

export function annualSettlementRangesOverlap(
  a: AnnualSettlementCoverageRow,
  b: AnnualSettlementCoverageRow,
): boolean {
  const af = periodIndex(a.coverage_from_year, a.coverage_from_month);
  const au = periodIndex(a.coverage_until_year, a.coverage_until_month);
  const bf = periodIndex(b.coverage_from_year, b.coverage_from_month);
  const bu = periodIndex(b.coverage_until_year, b.coverage_until_month);
  return !(au < bf || bu < af);
}

export function annualSettlementPeriodIndicesForYear(
  rows: readonly AnnualSettlementCoverageRow[],
  viewYear: number,
): Set<number> {
  const set = new Set<number>();
  for (let m = 1; m <= 12; m++) {
    if (rows.some((r) => periodInAnnualSettlementCoverage(viewYear, m, r))) {
      set.add(periodIndex(viewYear, m));
    }
  }
  return set;
}
