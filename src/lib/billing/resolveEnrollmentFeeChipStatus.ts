import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

export type EnrollmentFeeChipStatus = "exempt" | "approved" | "pending" | "rejected" | "due";

export function sectionShowsEnrollmentFeeChip(
  row: StudentMonthlyPaymentSectionRow,
): boolean {
  if (row.enrollmentFeeExempt) return true;
  return row.enrollmentFeeAmount > 0 && row.enrollmentId != null;
}

export function resolveEnrollmentFeeChipStatus(
  row: StudentMonthlyPaymentSectionRow,
): EnrollmentFeeChipStatus | null {
  if (!sectionShowsEnrollmentFeeChip(row)) return null;
  if (row.enrollmentFeeExempt) return "exempt";
  if (row.lastEnrollmentPaidAt || row.enrollmentFeeReceiptStatus === "approved") {
    return "approved";
  }
  if (row.enrollmentFeeReceiptStatus === "pending") return "pending";
  if (row.enrollmentFeeReceiptStatus === "rejected") return "rejected";
  return "due";
}
