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
  /**
   * Moneda en la que se cobra la matrícula. Por contrato, coincide con la
   * `currency` del plan vigente; cuando no hay plan activo es `null` y la
   * matrícula no debe mostrarse con importe.
   */
  enrollmentFeeCurrency: string | null;
  cells: StudentMonthlyPaymentCell[];
  /** Plan effective for the current month (when present), used by the focus card. */
  currentPlan: SectionFeePlan | null;
}

export interface StudentMonthlyPaymentsView {
  todayMonth: number;
  todayYear: number;
  rows: StudentMonthlyPaymentSectionRow[];
}
