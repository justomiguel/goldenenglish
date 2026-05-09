import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { calendarYearAnnualSettlementCoverage } from "@/lib/billing/annualSettlementPeriod";
import type { AnnualTuitionSettlementApplyResult } from "@/lib/billing/annualTuitionSettlementTypes";
import { collectBillableMonthsForSettlementYear } from "@/lib/billing/collectBillableMonthsForSettlementYear";
import { computeAnnualTuitionSettlementAllocations } from "@/lib/billing/computeAnnualTuitionSettlementAllocations";
import { recordApprovedPaymentWithAmount } from "@/lib/billing/recordApprovedPaymentWithAmountCore";
import { revertOneApprovedPayment } from "@/lib/billing/revertApprovedPaymentCore";
import {
  assertNoOverlappingSettlement,
  loadEnrollmentForSettlement,
  preflightSettlementPaymentsNotBlocked,
} from "@/lib/billing/annualTuitionSettlementSupport";

export type { AnnualTuitionSettlementApplyResult, AnnualTuitionSettlementErrorCode } from "@/lib/billing/annualTuitionSettlementTypes";

export async function applyAnnualTuitionSettlement(
  supabase: SupabaseClient,
  input: {
    actorId: string;
    enrollmentId: string;
    coverageYear: number;
    acceptedTotal: number;
    includesEnrollmentFee: boolean;
    adminNote: string | null;
  },
): Promise<AnnualTuitionSettlementApplyResult> {
  const enr = await loadEnrollmentForSettlement(supabase, input.enrollmentId);
  if (!enr) return { ok: false, code: "enrollment_not_found" };

  const newCov = calendarYearAnnualSettlementCoverage(input.coverageYear);
  if (!(await assertNoOverlappingSettlement(supabase, input.enrollmentId, newCov))) {
    return { ok: false, code: "overlap" };
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

  const allocation = computeAnnualTuitionSettlementAllocations({
    billableMonths,
    enrollmentFeeList,
    includesEnrollmentFee: input.includesEnrollmentFee && enrollmentFeeList > 0,
    acceptedTotal: input.acceptedTotal,
  });

  if (!allocation.ok) {
    return { ok: false, code: "allocation_failed", message: allocation.code };
  }

  if (
    !(await preflightSettlementPaymentsNotBlocked(supabase, enr.student_id, enr.section_id, allocation.months))
  ) {
    return { ok: false, code: "payment_preflight_failed" };
  }

  const settlementId = randomUUID();
  const noteBase = [input.adminNote?.trim() || null, `annual_settlement:${settlementId}`]
    .filter(Boolean)
    .join("\n");

  const { error: insErr } = await supabase.from("section_enrollment_annual_settlements").insert({
    id: settlementId,
    enrollment_id: enr.id,
    section_id: enr.section_id,
    student_id: enr.student_id,
    coverage_from_year: input.coverageYear,
    coverage_from_month: 1,
    coverage_until_year: input.coverageYear,
    coverage_until_month: 12,
    includes_enrollment_fee: Boolean(allocation.enrollmentFeePortion > 0),
    baseline_list_total: allocation.baselineListTotal,
    accepted_total: input.acceptedTotal,
    implied_discount_amount: allocation.impliedDiscountAmount,
    currency,
    created_by: input.actorId,
  });

  if (insErr) {
    logSupabaseClientError("applyAnnualTuitionSettlement:insertSettlement", insErr, {
      enrollmentId: input.enrollmentId,
    });
    return { ok: false, code: "settlement_insert_failed" };
  }

  const appliedStack: Array<{ year: number; month: number }> = [];

  try {
    for (const m of allocation.months) {
      const r = await recordApprovedPaymentWithAmount(supabase, {
        studentId: enr.student_id,
        sectionId: enr.section_id,
        year: m.year,
        month: m.month,
        amount: m.amount,
        adminNote: noteBase,
        actorId: input.actorId,
        correlationId: settlementId,
      });
      if (!r.success) {
        throw new Error(r.code);
      }
      appliedStack.push({ year: m.year, month: m.month });
    }

    if (allocation.enrollmentFeePortion > 0) {
      const { error: feeErr } = await supabase
        .from("section_enrollments")
        .update({
          last_enrollment_paid_at: new Date().toISOString(),
          enrollment_fee_receipt_status: "approved",
        })
        .eq("id", enr.id);
      if (feeErr) {
        throw new Error("fee_update_failed");
      }
    }
  } catch (err) {
    await supabase.from("section_enrollment_annual_settlements").delete().eq("id", settlementId);
    for (const p of [...appliedStack].reverse()) {
      await revertOneApprovedPayment(supabase, {
        studentId: enr.student_id,
        sectionId: enr.section_id,
        year: p.year,
        month: p.month,
        adminNote: "annual settlement rolled back",
        actorId: input.actorId,
        correlationId: settlementId,
      });
    }
    const code =
      err instanceof Error && err.message === "fee_update_failed"
        ? "fee_update_failed"
        : "payment_preflight_failed";
    return { ok: false, code };
  }

  const batchAudit = await auditFinanceAction({
    actorId: input.actorId,
    actorRole: "admin",
    action: "create",
    resourceType: "payment_batch",
    resourceId: settlementId,
    summary: `Annual tuition settlement ${input.coverageYear}`,
    afterValues: {
      coverage_year: input.coverageYear,
      months: allocation.months.length,
      accepted_total: input.acceptedTotal,
    },
    metadata: {
      student_id: enr.student_id,
      section_id: enr.section_id,
      settlement_id: settlementId,
      months: allocation.months.map((x) => x.month),
    },
    correlationId: settlementId,
  });
  if (!batchAudit?.ok) {
    logSupabaseClientError("applyAnnualTuitionSettlement:batchAudit", new Error("audit_failed"), {
      settlementId,
    });
  }

  return {
    ok: true,
    settlementId,
    baselineListTotal: allocation.baselineListTotal,
    impliedDiscountAmount: allocation.impliedDiscountAmount,
  };
}
