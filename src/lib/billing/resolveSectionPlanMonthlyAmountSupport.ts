import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import type { AnnualSettlementCoverageRow } from "@/lib/billing/annualSettlementPeriod";

export function parseUtcDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const trimmed = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = trimmed.split("-").map((n) => Number(n));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

export async function loadAnnualSettlementsForEnrollment(
  supabase: SupabaseClient,
  enrollmentId: string,
): Promise<AnnualSettlementCoverageRow[]> {
  const { data } = await supabase
    .from("section_enrollment_annual_settlements")
    .select(
      "coverage_from_year, coverage_from_month, coverage_until_year, coverage_until_month",
    )
    .eq("enrollment_id", enrollmentId);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    coverage_from_year: Number(r.coverage_from_year),
    coverage_from_month: Number(r.coverage_from_month),
    coverage_until_year: Number(r.coverage_until_year),
    coverage_until_month: Number(r.coverage_until_month),
  }));
}

export async function loadScholarshipRowsForEnrollment(
  supabase: SupabaseClient,
  enrollmentId: string | null,
): Promise<ScholarshipRow[]> {
  if (!enrollmentId) return [];
  const { data: scholarshipRows } = await supabase
    .from("section_enrollment_scholarships")
    .select(
      "id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
    )
    .eq("enrollment_id", enrollmentId);
  return ((scholarshipRows ?? []) as Array<ScholarshipRow>).map((row) => ({
    id: row.id,
    discount_percent: Number(row.discount_percent),
    note: row.note ?? null,
    valid_from_year: row.valid_from_year,
    valid_from_month: row.valid_from_month,
    valid_until_year: row.valid_until_year,
    valid_until_month: row.valid_until_month,
    is_active: Boolean(row.is_active),
  }));
}
