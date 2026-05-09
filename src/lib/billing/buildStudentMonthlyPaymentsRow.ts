import type { StudentMonthlyPaymentCell, StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";
import {
  effectiveAmountAfterScholarship,
  effectiveScholarshipPercentForPeriod,
  periodIndex,
} from "@/lib/billing/scholarshipPeriod";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import {
  countSectionMonthlyClasses,
  intersectDateRange,
  monthBounds,
} from "@/lib/billing/countSectionMonthlyClasses";
import { prorateMonthlyFee } from "@/lib/billing/prorateMonthlyFee";
import {
  parseUtcDate,
  fallbackFullMonthProration,
  type StudentMonthlyPaymentRecord,
  type BuildStudentMonthlyPaymentsRowInput,
} from "@/lib/billing/studentMonthlyPaymentsRowModel";

export type { StudentMonthlyPaymentRecord, BuildStudentMonthlyPaymentsRowInput };

/**
 * Pure: build the 12-month row for a student in a given section, computing
 * the cell status, expected amount (after proration + scholarship) and
 * current-month flag.
 *
 * Cell statuses:
 *   approved/rejected/exempt: derived from the existing payment row.
 *   pending:    a payment row exists with status pending and a receipt was uploaded.
 *   due:        the month has at least one available class for the student and
 *               there is an effective plan; no payment row yet (or pending
 *               without receipt).
 *   out-of-period: the month is outside the section's active window or the
 *               student wasn't enrolled yet (no class was available for them).
 *   no-plan:    the section has no plan effective for this month at all.
 */
export function buildStudentMonthlyPaymentsRow(
  input: BuildStudentMonthlyPaymentsRowInput,
): StudentMonthlyPaymentSectionRow {
  const {
    plans,
    payments,
    scholarship,
    todayYear,
    todayMonth,
    sectionStartsOn,
    sectionEndsOn,
    studentEnrolledAt,
    scheduleSlots,
    sectionEnrollmentFeeAmount,
    sectionEnrollmentFeeExempt = false,
    sectionEnrollmentFeeExemptReason = null,
    billingScope = "operational-window",
    annualSettlementCoverage = null,
  } = input;
  const cells: StudentMonthlyPaymentCell[] = [];
  const year = todayYear;
  const paymentByMonth = new Map<number, StudentMonthlyPaymentRecord>();
  for (const p of payments) {
    if (p.year === year) paymentByMonth.set(p.month, p);
  }
  const sectionRange = (() => {
    const from = parseUtcDate(sectionStartsOn);
    const until = parseUtcDate(sectionEndsOn);
    return from && until && from.getTime() <= until.getTime() ? { from, until } : null;
  })();
  const enrolmentFrom = parseUtcDate(studentEnrolledAt);

  for (let m = 1; m <= 12; m++) {
    const plan = resolveEffectiveSectionFeePlan(plans, year, m);
    const monthRange = monthBounds(year, m);
    const sectionInMonth = sectionRange ? intersectDateRange(sectionRange, monthRange) : null;
    const totalClasses = sectionInMonth
      ? countSectionMonthlyClasses({
          scheduleSlots,
          from: sectionInMonth.from,
          until: sectionInMonth.until,
        })
      : 0;
    const studentRange = enrolmentFrom && sectionInMonth
      ? intersectDateRange(sectionInMonth, { from: enrolmentFrom, until: monthRange.until })
      : sectionInMonth;
    const availableClasses = studentRange
      ? countSectionMonthlyClasses({
          scheduleSlots,
          from: studentRange.from,
          until: studentRange.until,
        })
      : 0;
    const prorated = plan
      ? billingScope === "plan-year"
        ? fallbackFullMonthProration(plan.monthlyFee)
        : totalClasses > 0 && availableClasses > 0
        ? prorateMonthlyFee({
            monthlyFee: plan.monthlyFee,
            totalClassesInMonth: totalClasses,
            availableClassesForStudent: availableClasses,
          })
        : sectionInMonth && studentRange
          ? fallbackFullMonthProration(plan.monthlyFee)
          : { code: "out_of_period" as const }
      : { code: "out_of_period" as const };
    const settlementCovers =
      annualSettlementCoverage?.has(periodIndex(year, m)) ?? false;
    const scholarshipForCell = settlementCovers ? [] : scholarship;
    const scholarshipDiscountPercent =
      plan ? effectiveScholarshipPercentForPeriod(scholarshipForCell, year, m) : 0;
    const scholarshipPreview =
      plan && prorated.code !== "ok" && scholarshipDiscountPercent > 0
        ? fallbackFullMonthProration(plan.monthlyFee).amount
        : null;
    const originalExpected =
      plan && prorated.code === "ok" ? prorated.amount : scholarshipPreview;
    const expected =
      originalExpected != null
        ? effectiveAmountAfterScholarship(originalExpected, year, m, scholarshipForCell)
        : null;
    const fullMonthOriginalExpected =
      plan && (prorated.code === "ok" || scholarshipPreview != null)
        ? fallbackFullMonthProration(plan.monthlyFee).amount
        : null;
    const fullMonthExpected =
      fullMonthOriginalExpected != null
        ? effectiveAmountAfterScholarship(
            fullMonthOriginalExpected,
            year,
            m,
            scholarshipForCell,
          )
        : null;
    const proration =
      plan && prorated.code === "ok"
        ? { numerator: prorated.numerator, denominator: prorated.denominator }
        : null;
    const row = paymentByMonth.get(m) ?? null;
    const isFullyCovered = expected != null && expected <= 0;
    let status: StudentMonthlyPaymentCell["status"];
    if (!plan) {
      status = "no-plan";
    } else if (row?.status === "approved") {
      status = "approved";
    } else if (row?.status === "exempt") {
      status = "exempt";
    } else if (isFullyCovered) {
      status = "exempt";
    } else if (prorated.code !== "ok") {
      status = "out-of-period";
    } else if (row?.status === "rejected") {
      status = "rejected";
    } else if (row?.status === "pending" && row.receiptSignedUrl) {
      status = "pending";
    } else {
      status = "due";
    }
    cells.push({
      month: m,
      year,
      status,
      expectedAmount: expected,
      originalExpectedAmount: originalExpected,
      scholarshipDiscountPercent:
        scholarshipDiscountPercent > 0 ? scholarshipDiscountPercent : null,
      fullMonthExpectedAmount: fullMonthExpected,
      fullMonthOriginalExpectedAmount: fullMonthOriginalExpected,
      currency: plan?.currency ?? null,
      proration,
      recordedAmount: row?.amount ?? null,
      paymentId: row?.id ?? null,
      receiptSignedUrl: row?.receiptSignedUrl ?? null,
      isCurrent: m === todayMonth && year === todayYear,
    });
  }
  const currentPlan = resolveEffectiveSectionFeePlan(plans, todayYear, todayMonth);
  const enrollmentFeeAmount = Number.isFinite(sectionEnrollmentFeeAmount)
    ? Math.max(0, sectionEnrollmentFeeAmount)
    : 0;
  return {
    sectionId: input.sectionId,
    sectionName: input.sectionName,
    cohortName: input.cohortName,
    hasActivePlan: currentPlan != null,
    enrollmentFeeAmount,
    enrollmentFeeExempt: sectionEnrollmentFeeExempt,
    enrollmentFeeExemptReason: sectionEnrollmentFeeExempt ? sectionEnrollmentFeeExemptReason : null,
    enrollmentFeeCurrency: enrollmentFeeAmount > 0 ? currentPlan?.currency ?? null : null,
    cells,
    currentPlan,
    enrollmentId: input.enrollmentId ?? null,
    enrollmentFeeReceiptStatus: input.enrollmentFeeReceiptStatus ?? null,
    enrollmentFeeReceiptSignedUrl: input.enrollmentFeeReceiptSignedUrl ?? null,
    lastEnrollmentPaidAt: input.lastEnrollmentPaidAt ?? null,
  };
}
