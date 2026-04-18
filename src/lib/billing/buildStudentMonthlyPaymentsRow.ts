import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import {
  effectiveAmountAfterScholarship,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import {
  countSectionMonthlyClasses,
  intersectDateRange,
  monthBounds,
} from "@/lib/billing/countSectionMonthlyClasses";
import { prorateMonthlyFee } from "@/lib/billing/prorateMonthlyFee";

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
  /** ISO date (YYYY-MM-DD). Inicio operativo de la sección. */
  sectionStartsOn: string;
  /** ISO date (YYYY-MM-DD). Fin operativo de la sección. */
  sectionEndsOn: string;
  /** ISO timestamp/date. Cuándo el alumno se enroló a esta sección. */
  studentEnrolledAt: string | null;
  /** Slots semanales que dicta la sección. */
  scheduleSlots: readonly SectionScheduleSlot[];
  /**
   * Monto de matrícula que cobra la sección (>= 0). 0 = la sección no cobra
   * matrícula. La moneda se reusa de la `currency` del plan vigente.
   */
  sectionEnrollmentFeeAmount: number;
}

function parseUtcDate(iso: string | null): Date | null {
  if (!iso) return null;
  const trimmed = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = trimmed.split("-").map((n) => Number(n));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

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
      ? prorateMonthlyFee({
          monthlyFee: plan.monthlyFee,
          totalClassesInMonth: totalClasses,
          availableClassesForStudent: availableClasses,
        })
      : { code: "out_of_period" as const };
    const expected = plan && prorated.code === "ok"
      ? effectiveAmountAfterScholarship(prorated.amount, year, m, scholarship)
      : null;
    const proration =
      plan && prorated.code === "ok"
        ? { numerator: prorated.numerator, denominator: prorated.denominator }
        : null;
    const row = paymentByMonth.get(m) ?? null;
    let status: StudentMonthlyPaymentCell["status"];
    if (!plan) {
      status = "no-plan";
    } else if (prorated.code !== "ok") {
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
    enrollmentFeeCurrency: enrollmentFeeAmount > 0 ? currentPlan?.currency ?? null : null,
    cells,
    currentPlan,
  };
}
