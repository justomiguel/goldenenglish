import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  annualSettlementRangesOverlap,
  type AnnualSettlementCoverageRow,
} from "@/lib/billing/annualSettlementPeriod";

export type SettlementEnrollmentRow = {
  id: string;
  student_id: string;
  section_id: string;
  enrollment_fee_exempt: boolean;
  academic_sections: { enrollment_fee_amount: string | number | null } | null;
};

export async function loadEnrollmentForSettlement(
  supabase: SupabaseClient,
  enrollmentId: string,
): Promise<SettlementEnrollmentRow | null> {
  const { data, error } = await supabase
    .from("section_enrollments")
    .select(
      "id, student_id, section_id, enrollment_fee_exempt, academic_sections ( enrollment_fee_amount )",
    )
    .eq("id", enrollmentId)
    .eq("status", "active")
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadEnrollmentForSettlement", error, { enrollmentId });
    return null;
  }
  return data as SettlementEnrollmentRow | null;
}

export async function assertNoOverlappingSettlement(
  supabase: SupabaseClient,
  enrollmentId: string,
  candidate: AnnualSettlementCoverageRow,
): Promise<boolean> {
  const { data } = await supabase
    .from("section_enrollment_annual_settlements")
    .select(
      "coverage_from_year, coverage_from_month, coverage_until_year, coverage_until_month",
    )
    .eq("enrollment_id", enrollmentId);
  for (const row of data ?? []) {
    const r = row as AnnualSettlementCoverageRow;
    if (annualSettlementRangesOverlap(candidate, r)) return false;
  }
  return true;
}

export async function preflightSettlementPaymentsNotBlocked(
  supabase: SupabaseClient,
  studentId: string,
  sectionId: string,
  months: readonly { year: number; month: number }[],
): Promise<boolean> {
  for (const m of months) {
    const { data: pay } = await supabase
      .from("payments")
      .select("status")
      .eq("student_id", studentId)
      .eq("section_id", sectionId)
      .eq("year", m.year)
      .eq("month", m.month)
      .maybeSingle();
    const st = pay?.status as string | undefined;
    if (st === "approved" || st === "exempt") return false;
  }
  return true;
}
