import type { SupabaseClient } from "@supabase/supabase-js";
import { calendarYearAnnualSettlementCoverage } from "@/lib/billing/annualSettlementPeriod";
import type { AnnualTuitionSettlementPreviewResult } from "@/lib/billing/annualTuitionSettlementTypes";
import { collectBillableMonthsForSettlementYear } from "@/lib/billing/collectBillableMonthsForSettlementYear";
import { computeAnnualTuitionSettlementAllocations } from "@/lib/billing/computeAnnualTuitionSettlementAllocations";
import {
  assertNoOverlappingSettlement,
  loadEnrollmentForSettlement,
} from "@/lib/billing/annualTuitionSettlementSupport";

export type { AnnualTuitionSettlementPreviewResult } from "@/lib/billing/annualTuitionSettlementTypes";

export async function previewAnnualTuitionSettlement(
  supabase: SupabaseClient,
  input: {
    enrollmentId: string;
    coverageYear: number;
    acceptedTotal: number;
    includesEnrollmentFee: boolean;
  },
): Promise<AnnualTuitionSettlementPreviewResult> {
  const enr = await loadEnrollmentForSettlement(supabase, input.enrollmentId);
  if (!enr) return { ok: false, code: "enrollment_not_found" };

  const newCov = calendarYearAnnualSettlementCoverage(input.coverageYear);
  if (!(await assertNoOverlappingSettlement(supabase, input.enrollmentId, newCov))) {
    return { ok: false, code: "overlap", message: "overlap" };
  }

  const feeListRaw = Number(enr.academic_sections?.enrollment_fee_amount ?? 0);
  const enrollmentFeeList =
    input.includesEnrollmentFee && !enr.enrollment_fee_exempt ? Math.max(0, feeListRaw) : 0;

  const { months: billableMonths, currency } = await collectBillableMonthsForSettlementYear(
    supabase,
    enr.student_id,
    enr.section_id,
    input.coverageYear,
  );

  const alloc = computeAnnualTuitionSettlementAllocations({
    billableMonths,
    enrollmentFeeList,
    includesEnrollmentFee: input.includesEnrollmentFee && enrollmentFeeList > 0,
    acceptedTotal: input.acceptedTotal,
  });

  if (!alloc.ok) {
    return { ok: false, code: "allocation_failed", message: alloc.code };
  }

  const monthsPreview = alloc.months.map((m) => {
    const list = billableMonths.find((b) => b.month === m.month)?.listAmount ?? 0;
    return { month: m.month, listAmount: list, allocatedAmount: m.amount };
  });

  return {
    ok: true,
    billableMonthCount: billableMonths.length,
    baselineListTotal: alloc.baselineListTotal,
    impliedDiscountAmount: alloc.impliedDiscountAmount,
    currency,
    monthsPreview,
    enrollmentFeeList,
    includesEnrollmentFee: input.includesEnrollmentFee && enrollmentFeeList > 0,
  };
}
