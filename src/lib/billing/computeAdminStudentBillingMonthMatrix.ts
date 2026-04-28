import { buildAdminBillingCollectionRowForYear } from "@/lib/billing/buildAdminBillingCollectionRowForYear";
import { buildAdminBillingMonthGrid } from "@/lib/billing/buildAdminBillingMonthGrid";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
  AdminStudentBillingSectionBenefit,
} from "@/types/adminStudentBilling";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

export interface ComputeAdminStudentBillingMonthMatrixInput {
  benefit: AdminStudentBillingSectionBenefit;
  payments: AdminBillingPaymentRow[];
  scholarships: AdminBillingScholarship[];
  billingYear: number;
  calendarTodayYear: number;
  calendarTodayMonth: number;
}

export interface ComputeAdminStudentBillingMonthMatrixResult {
  monthStates: ReturnType<typeof buildAdminBillingMonthGrid>;
  collectionCells: StudentMonthlyPaymentCell[] | null;
}

export function computeAdminStudentBillingMonthMatrix({
  benefit,
  payments,
  scholarships,
  billingYear,
  calendarTodayYear,
  calendarTodayMonth,
}: ComputeAdminStudentBillingMonthMatrixInput): ComputeAdminStudentBillingMonthMatrixResult {
  const monthStatesBase = buildAdminBillingMonthGrid({
    payments,
    scholarships,
    sectionId: benefit.sectionId,
    year: billingYear,
  });

  const collectionRow = buildAdminBillingCollectionRowForYear({
    sectionId: benefit.sectionId,
    sectionName: benefit.sectionName,
    cohortName: benefit.cohortName,
    sectionStartsOn: benefit.sectionStartsOn,
    sectionEndsOn: benefit.sectionEndsOn,
    enrollmentCreatedAt: benefit.enrollmentCreatedAt,
    feePlans: benefit.feePlans,
    scheduleSlots: benefit.scheduleSlots,
    sectionEnrollmentFeeAmount: benefit.sectionEnrollmentFeeAmount,
    enrollmentFeeExempt: benefit.enrollmentFeeExempt,
    enrollmentExemptReason: benefit.enrollmentExemptReason,
    enrollmentId: benefit.enrollmentId,
    enrollmentFeeReceiptStatus: benefit.enrollmentFeeReceiptStatus,
    enrollmentFeeReceiptSignedUrl: benefit.enrollmentFeeReceiptSignedUrl,
    scholarships,
    payments,
    viewYear: billingYear,
    calendarTodayYear,
    calendarTodayMonth,
  });

  const monthStates = monthStatesBase.map((ms, i) => {
    const cell = collectionRow.cells[i];
    if (cell && (cell.status === "no-plan" || cell.status === "out-of-period")) {
      return { ...ms, selectable: false };
    }
    return ms;
  });

  return { monthStates, collectionCells: collectionRow.cells };
}
