import type { SectionFeePlan } from "@/types/sectionFeePlan";

export type StudentMonthlyPaymentCellStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "exempt"
  | "due"
  | "out-of-period"
  | "no-plan";

export interface StudentMonthlyPaymentCell {
  month: number;
  year: number;
  status: StudentMonthlyPaymentCellStatus;
  /** Plan-derived expected amount (monthly fee, after scholarship) for the month, or null if no plan. */
  expectedAmount: number | null;
  /** Actual amount on the payments row, when present. */
  recordedAmount: number | null;
  /** payments.id when a row exists for (month, year), else null. */
  paymentId: string | null;
  /** Pre-signed URL to the receipt, when present. */
  receiptSignedUrl: string | null;
  /** True for the month that matches "today" (in the locale's calendar). */
  isCurrent: boolean;
}

export interface StudentMonthlyPaymentSectionRow {
  sectionId: string;
  sectionName: string;
  cohortName: string;
  hasActivePlan: boolean;
  chargesEnrollmentFee: boolean;
  cells: StudentMonthlyPaymentCell[];
  /** Plan effective for the current month (when present), used by the focus card. */
  currentPlan: SectionFeePlan | null;
}

export interface StudentMonthlyPaymentsView {
  todayMonth: number;
  todayYear: number;
  rows: StudentMonthlyPaymentSectionRow[];
}
