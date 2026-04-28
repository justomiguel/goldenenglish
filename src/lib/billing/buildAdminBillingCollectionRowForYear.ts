import {
  buildStudentMonthlyPaymentsRow,
  type StudentMonthlyPaymentRecord,
} from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";
import type { AdminBillingPaymentRow, AdminBillingScholarship } from "@/types/adminStudentBilling";
import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";

function mapPaymentRecordStatus(raw: string): StudentMonthlyPaymentRecord["status"] {
  switch (raw) {
    case "approved":
      return "approved";
    case "pending":
    case "pending_approval":
      return "pending";
    case "rejected":
      return "rejected";
    case "exempt":
      return "exempt";
    default:
      return "pending";
  }
}

function paymentsToSectionYearRecords(
  payments: AdminBillingPaymentRow[],
  sectionId: string,
  year: number,
): StudentMonthlyPaymentRecord[] {
  return payments
    .filter((p) => p.year === year && p.section_id === sectionId)
    .map((p) => ({
      id: p.id,
      sectionId: p.section_id,
      month: p.month,
      year: p.year,
      amount: p.amount,
      status: mapPaymentRecordStatus(p.status),
      receiptSignedUrl: p.receiptSignedUrl,
    }));
}

export interface BuildAdminBillingCollectionRowForYearInput {
  sectionId: string;
  sectionName: string;
  cohortName: string;
  sectionStartsOn: string;
  sectionEndsOn: string;
  enrollmentCreatedAt: string | null;
  feePlans: SectionFeePlan[];
  scheduleSlots: readonly SectionScheduleSlot[];
  sectionEnrollmentFeeAmount: number;
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  enrollmentId: string | null;
  enrollmentFeeReceiptStatus: "pending" | "approved" | "rejected" | null;
  enrollmentFeeReceiptSignedUrl: string | null;
  scholarships: AdminBillingScholarship[];
  payments: AdminBillingPaymentRow[];
  viewYear: number;
  calendarTodayYear: number;
  calendarTodayMonth: number;
}

/**
 * Same row math as Finance → Cobranzas por sección (`billingScope: "plan-year"`),
 * scoped to the calendar year the admin is viewing.
 */
export function buildAdminBillingCollectionRowForYear(
  input: BuildAdminBillingCollectionRowForYearInput,
): StudentMonthlyPaymentSectionRow {
  const records = paymentsToSectionYearRecords(input.payments, input.sectionId, input.viewYear);
  return buildStudentMonthlyPaymentsRow({
    sectionId: input.sectionId,
    sectionName: input.sectionName,
    cohortName: input.cohortName || input.sectionName,
    plans: input.feePlans,
    payments: records,
    scholarship: input.scholarships,
    todayYear: input.viewYear,
    todayMonth: input.calendarTodayMonth,
    sectionStartsOn: input.sectionStartsOn,
    sectionEndsOn: input.sectionEndsOn,
    studentEnrolledAt: input.enrollmentCreatedAt,
    scheduleSlots: input.scheduleSlots,
    sectionEnrollmentFeeAmount: input.sectionEnrollmentFeeAmount,
    sectionEnrollmentFeeExempt: input.enrollmentFeeExempt,
    sectionEnrollmentFeeExemptReason: input.enrollmentExemptReason,
    billingScope: "plan-year",
    enrollmentId: input.enrollmentId,
    enrollmentFeeReceiptStatus: input.enrollmentFeeReceiptStatus,
    enrollmentFeeReceiptSignedUrl: input.enrollmentFeeReceiptSignedUrl,
  });
}
