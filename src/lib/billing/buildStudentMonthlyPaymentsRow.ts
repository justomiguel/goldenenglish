import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import {
  isMonthInPlanPeriod,
  resolveEffectiveSectionFeePlan,
} from "@/lib/billing/resolveEffectiveSectionFeePlan";

export interface StudentMonthlyPaymentRecord {
  id: string;
  /** Optional: when present, the row belongs to that specific section. */
  sectionId: string | null;
  month: number;
  year: number;
  amount: number | null;
  status: "pending" | "approved" | "rejected" | "exempt";
  receiptSignedUrl: string | null;
}

export interface BuildStudentMonthlyPaymentsRowInput {
  sectionId: string;
  sectionName: string;
  cohortName: string;
  /** All known plans for this section (any number of vigencias). */
  plans: SectionFeePlan[];
  /** All known payment rows for this student in the calendar year. */
  payments: StudentMonthlyPaymentRecord[];
  scholarship: ScholarshipRow | null;
  todayYear: number;
  todayMonth: number;
}

/**
 * Pure: build the 12-month row for a student in a given section, computing
 * the cell status, expected amount (after scholarship) and current-month flag.
 *
 * Cell statuses:
 *   approved/rejected/exempt: derived from the existing payment row.
 *   pending:    a payment row exists with status pending and a receipt was uploaded.
 *   due:        the month is in-period, no payment row exists yet (or row is
 *               pending with no receipt). The student can upload a receipt.
 *   out-of-period: the month is before/after the plan window.
 *   no-plan:    the section has no plan effective for this month at all.
 */
export function buildStudentMonthlyPaymentsRow(
  input: BuildStudentMonthlyPaymentsRowInput,
): StudentMonthlyPaymentSectionRow {
  const { plans, payments, scholarship, todayYear, todayMonth } = input;
  const cells: StudentMonthlyPaymentCell[] = [];
  const year = todayYear;
  const paymentByMonth = new Map<number, StudentMonthlyPaymentRecord>();
  for (const p of payments) {
    if (p.year === year) paymentByMonth.set(p.month, p);
  }
  for (let m = 1; m <= 12; m++) {
    const plan = resolveEffectiveSectionFeePlan(plans, year, m);
    const inPeriod = plan ? isMonthInPlanPeriod(plan, year, m) : false;
    const expectedRaw = plan ? plan.monthlyFee : null;
    const expected = expectedRaw == null
      ? null
      : effectiveAmountAfterScholarship(expectedRaw, year, m, scholarship);
    const row = paymentByMonth.get(m) ?? null;
    let status: StudentMonthlyPaymentCell["status"];
    if (!plan) {
      status = "no-plan";
    } else if (!inPeriod) {
      status = "out-of-period";
    } else if (row?.status === "approved") {
      status = "approved";
    } else if (row?.status === "rejected") {
      status = "rejected";
    } else if (row?.status === "exempt") {
      status = "exempt";
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
      recordedAmount: row?.amount ?? null,
      paymentId: row?.id ?? null,
      receiptSignedUrl: row?.receiptSignedUrl ?? null,
      isCurrent: m === todayMonth && year === todayYear,
    });
  }
  const currentPlan = resolveEffectiveSectionFeePlan(plans, todayYear, todayMonth);
  return {
    sectionId: input.sectionId,
    sectionName: input.sectionName,
    cohortName: input.cohortName,
    hasActivePlan: currentPlan != null,
    chargesEnrollmentFee: currentPlan?.chargesEnrollmentFee ?? false,
    cells,
    currentPlan,
  };
}
