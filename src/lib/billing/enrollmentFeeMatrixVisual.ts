import { enrollmentFeeIsOverduePrimitives } from "@/lib/billing/enrollmentFeeDue";
import type {
  EnrollmentFeeReceiptStatus,
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

/**
 * Visual state for “month 0” (enrollment fee) to reuse Finance matrix styling.
 */
export function enrollmentFeeMatrixVisualFromSectionRow(
  row: Pick<
    StudentMonthlyPaymentSectionRow,
    | "enrollmentFeeAmount"
    | "enrollmentFeeExempt"
    | "enrollmentFeeReceiptStatus"
    | "enrollmentFeeReceiptSignedUrl"
  >,
  opts: {
    sectionChargesEnrollmentFee: boolean;
    sectionStartsOn: string;
    enrolledAt: string | null;
    todayYear: number;
    todayMonth: number;
  },
): { status: StudentMonthlyPaymentCell["status"]; isOverdue: boolean } | null {
  if (!opts.sectionChargesEnrollmentFee) {
    return null;
  }
  if (row.enrollmentFeeExempt) {
    return { status: "exempt", isOverdue: false };
  }
  if (row.enrollmentFeeAmount <= 0) {
    return null;
  }
  const st = row.enrollmentFeeReceiptStatus;
  if (st === "approved") {
    return { status: "approved", isOverdue: false };
  }
  if (st === "rejected") {
    return { status: "rejected", isOverdue: false };
  }
  if (st === "pending") {
    return { status: "pending", isOverdue: false };
  }
  const overdue = enrollmentFeeIsOverduePrimitives(
    opts.sectionStartsOn,
    opts.enrolledAt,
    opts.todayYear,
    opts.todayMonth,
  );
  return { status: "due", isOverdue: overdue };
}

/** Admin billing tab: same rules using section benefit + operational dates. */
export function enrollmentFeeMatrixVisualFromAdminBillingBenefit(
  benefit: {
    enrollmentFeeExempt: boolean;
    enrollmentFeeReceiptStatus: EnrollmentFeeReceiptStatus | null;
    enrollmentFeeReceiptSignedUrl: string | null;
    sectionEnrollmentFeeAmount: number;
  },
  opts: {
    sectionStartsOn: string;
    enrolledAt: string | null;
    todayYear: number;
    todayMonth: number;
  },
): ReturnType<typeof enrollmentFeeMatrixVisualFromSectionRow> {
  return enrollmentFeeMatrixVisualFromSectionRow(
    {
      enrollmentFeeAmount: benefit.enrollmentFeeExempt ? 0 : benefit.sectionEnrollmentFeeAmount,
      enrollmentFeeExempt: benefit.enrollmentFeeExempt,
      enrollmentFeeReceiptStatus: benefit.enrollmentFeeReceiptStatus,
      enrollmentFeeReceiptSignedUrl: benefit.enrollmentFeeReceiptSignedUrl,
    },
    {
      sectionChargesEnrollmentFee: benefit.sectionEnrollmentFeeAmount > 0,
      sectionStartsOn: opts.sectionStartsOn,
      enrolledAt: opts.enrolledAt,
      todayYear: opts.todayYear,
      todayMonth: opts.todayMonth,
    },
  );
}
