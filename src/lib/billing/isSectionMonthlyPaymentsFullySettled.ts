import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

/** Month had a fee obligation (plan in period), not merely out-of-period / no-plan. */
export function isPayableMonthlyCell(cell: StudentMonthlyPaymentCell): boolean {
  if (cell.status === "no-plan") return false;
  if (cell.status === "out-of-period") {
    return cell.expectedAmount != null && cell.expectedAmount > 0;
  }
  return true;
}

export function isMonthlyCellSettled(cell: StudentMonthlyPaymentCell): boolean {
  return cell.status === "approved" || cell.status === "exempt";
}

export function isSectionEnrollmentSettled(row: StudentMonthlyPaymentSectionRow): boolean {
  if (row.enrollmentFeeExempt) return true;
  if (row.enrollmentFeeAmount <= 0) return true;
  if (row.lastEnrollmentPaidAt) return true;
  if (row.enrollmentFeeReceiptStatus === "approved") return true;
  return false;
}

/**
 * True when every billable month is approved/exempt and enrollment (if any) is satisfied.
 */
export function isSectionMonthlyPaymentsFullySettled(
  row: StudentMonthlyPaymentSectionRow,
): boolean {
  if (!isSectionEnrollmentSettled(row)) return false;
  const payable = row.cells.filter(isPayableMonthlyCell);
  if (payable.length === 0) return true;
  return payable.every(isMonthlyCellSettled);
}
