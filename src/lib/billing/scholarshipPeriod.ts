/** Month/year as a single comparable index (month 1–12). */
export function periodIndex(year: number, month: number): number {
  return year * 12 + month;
}

export type ScholarshipRow = {
  discount_percent: number;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

export function isPeriodCoveredByScholarship(
  year: number,
  month: number,
  s: ScholarshipRow | null,
): boolean {
  if (!s || !s.is_active) return false;
  const p = periodIndex(year, month);
  const start = periodIndex(s.valid_from_year, s.valid_from_month);
  if (p < start) return false;
  if (s.valid_until_year == null || s.valid_until_month == null) return true;
  const end = periodIndex(s.valid_until_year, s.valid_until_month);
  return p <= end;
}

export function effectiveAmountAfterScholarship(
  baseAmount: number | null,
  year: number,
  month: number,
  s: ScholarshipRow | null,
): number | null {
  if (baseAmount == null) return null;
  if (!isPeriodCoveredByScholarship(year, month, s)) return baseAmount;
  if (!s) return baseAmount;
  const pct = Number(s.discount_percent);
  if (Number.isNaN(pct) || pct <= 0) return baseAmount;
  const factor = Math.max(0, 1 - pct / 100);
  return Math.round(baseAmount * factor * 100) / 100;
}
