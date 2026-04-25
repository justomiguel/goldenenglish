import type { SectionFeePlan } from "@/types/sectionFeePlan";

export type StudentMonthlyPaymentCellStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "exempt"
  | "due"
  | "out-of-period"
  | "no-plan";

export interface StudentMonthlyPaymentProration {
  /** Clases disponibles para el alumno en el mes (numerador). */
  numerator: number;
  /** Clases totales de la sección en el mes (denominador). */
  denominator: number;
}

export interface StudentMonthlyPaymentCell {
  month: number;
  year: number;
  status: StudentMonthlyPaymentCellStatus;
  /** Plan-derived expected amount (monthly fee, after proration + scholarship) for the month, or null if no plan. */
  expectedAmount: number | null;
  /** Expected amount before scholarship, after any operational proration. */
  originalExpectedAmount?: number | null;
  /** Effective scholarship percentage applied to this period, or null when no discount applies. */
  scholarshipDiscountPercent?: number | null;
  /**
   * Same fee rules as {@link expectedAmount} but on the full monthly fee (no
   * class-based proration). Used in the student receipt panel when we show the
   * mes completo instead of the prorated operativo.
   */
  fullMonthExpectedAmount: number | null;
  /** Full monthly fee before scholarship. */
  fullMonthOriginalExpectedAmount?: number | null;
  /** ISO 4217 currency for the cell, or null when there is no active plan. */
  currency: string | null;
  /** Prorrateo aplicado al expectedAmount (numerator/denominator); null si no aplica. */
  proration: StudentMonthlyPaymentProration | null;
  /** Actual amount on the payments row, when present. */
  recordedAmount: number | null;
  /** payments.id when a row exists for (month, year), else null. */
  paymentId: string | null;
  /** Pre-signed URL to the receipt, when present. */
  receiptSignedUrl: string | null;
  /** True for the month that matches "today" (in the locale's calendar). */
  isCurrent: boolean;
}

export type EnrollmentFeeReceiptStatus = "pending" | "approved" | "rejected";

export interface StudentMonthlyPaymentSectionRow {
  sectionId: string;
  sectionName: string;
  cohortName: string;
  hasActivePlan: boolean;
  /**
   * Monto de matrícula que cobra la sección (definido a nivel de sección).
   * `0` significa que la sección no cobra matrícula.
   */
  enrollmentFeeAmount: number;
  /** True when admin waived the enrollment fee for this student in this section. */
  enrollmentFeeExempt: boolean;
  /** Admin-provided reason shown to students/tutors when the enrollment fee is waived. */
  enrollmentFeeExemptReason: string | null;
  /**
   * Moneda en la que se cobra la matrícula. Por contrato, coincide con la
   * `currency` del plan vigente; cuando no hay plan activo es `null` y la
   * matrícula no debe mostrarse con importe.
   */
  enrollmentFeeCurrency: string | null;
  cells: StudentMonthlyPaymentCell[];
  /** Plan effective for the current month (when present), used by the focus card. */
  currentPlan: SectionFeePlan | null;
  /**
   * `section_enrollments.id` for this student+section combo. Needed to scope
   * the enrollment fee receipt actions.
   */
  enrollmentId: string | null;
  /** Review status of the student-uploaded enrollment fee receipt. */
  enrollmentFeeReceiptStatus: EnrollmentFeeReceiptStatus | null;
  /** Pre-signed URL for the uploaded enrollment fee receipt, when present. */
  enrollmentFeeReceiptSignedUrl: string | null;
}

export interface StudentMonthlyPaymentsView {
  todayMonth: number;
  todayYear: number;
  rows: StudentMonthlyPaymentSectionRow[];
}
