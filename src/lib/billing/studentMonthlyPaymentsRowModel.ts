import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";
import type {
  EnrollmentFeeReceiptStatus,
} from "@/types/studentMonthlyPayments";
import type { ScholarshipRows } from "@/lib/billing/scholarshipPeriod";

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
  scholarship: ScholarshipRows;
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
  sectionEnrollmentFeeExempt?: boolean;
  sectionEnrollmentFeeExemptReason?: string | null;
  /**
   * Student-facing strips use the operational calendar for proration. Admin
   * collection matrices can use the fee-plan year as the billing contract.
   */
  billingScope?: "operational-window" | "plan-year";
  enrollmentId?: string | null;
  enrollmentFeeReceiptStatus?: EnrollmentFeeReceiptStatus | null;
  enrollmentFeeReceiptSignedUrl?: string | null;
  /** When staff recorded payment outside the receipt-review flow. */
  lastEnrollmentPaidAt?: string | null;
}

export function parseUtcDate(iso: string | null): Date | null {
  if (!iso) return null;
  const trimmed = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = trimmed.split("-").map((n) => Number(n));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

export function fallbackFullMonthProration(monthlyFee: number) {
  return {
    code: "ok" as const,
    amount: Math.round((monthlyFee + Number.EPSILON) * 100) / 100,
    numerator: 1,
    denominator: 1,
    full: true,
  };
}
