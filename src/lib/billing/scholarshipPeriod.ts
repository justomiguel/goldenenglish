/** Month/year as a single comparable index (month 1–12). */
export function periodIndex(year: number, month: number): number {
  return year * 12 + month;
}

export type ScholarshipRow = {
  id?: string;
  discount_percent: number;
  note?: string | null;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

export type ScholarshipRows = readonly ScholarshipRow[] | ScholarshipRow | null;

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

function normalizeScholarships(scholarships: ScholarshipRows): readonly ScholarshipRow[] {
  if (!scholarships) return [];
  if (Array.isArray(scholarships)) return scholarships as readonly ScholarshipRow[];
  return [scholarships as ScholarshipRow];
}

export function effectiveScholarshipPercentForPeriod(
  scholarships: ScholarshipRows,
  year: number,
  month: number,
): number {
  const total = normalizeScholarships(scholarships).reduce((sum, scholarship) => {
    if (!isPeriodCoveredByScholarship(year, month, scholarship)) return sum;
    const pct = Number(scholarship.discount_percent);
    return Number.isFinite(pct) && pct > 0 ? sum + pct : sum;
  }, 0);
  return Math.min(100, Math.max(0, Math.round(total * 100) / 100));
}

export function effectiveAmountAfterScholarship(
  baseAmount: number | null,
  year: number,
  month: number,
  s: ScholarshipRows,
): number | null {
  if (baseAmount == null) return null;
  const pct = effectiveScholarshipPercentForPeriod(s, year, month);
  if (pct <= 0) return baseAmount;
  const factor = Math.max(0, 1 - pct / 100);
  return Math.round(baseAmount * factor * 100) / 100;
}
