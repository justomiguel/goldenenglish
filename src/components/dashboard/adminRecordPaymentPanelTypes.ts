import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import type { Dictionary, Locale } from "@/types/i18n";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

type BillingLabels = Dictionary["admin"]["billing"];

export type AdminRecordPaymentEnrollmentFeeSnapshot = {
  enrollmentId: string | null;
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
  receiptSignedUrl: string | null;
  receiptStatus: "pending" | "approved" | "rejected" | null;
};

export interface AdminRecordPaymentPanelProps {
  locale: Locale;
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  year: number;
  monthStates: AdminBillingMonthState[];
  /** When set, monthly chips match Cobranzas (`buildStudentMonthlyPaymentsRow`). */
  collectionCells?: StudentMonthlyPaymentCell[] | null;
  labels: BillingLabels;
  sectionMonthlyFeeAmount?: number | null;
  sectionMonthlyFeeCurrency?: string | null;
  showEnrollmentMonthZero: boolean;
  enrollmentMonthZeroVisual: {
    status: StudentMonthlyPaymentCell["status"];
    isOverdue: boolean;
  } | null;
  /** Enrollment row fields when the section charges matrícula — enables opening the enrollment modal from column “0”. */
  enrollmentFeeModal?: AdminRecordPaymentEnrollmentFeeSnapshot | null;
  /** Omit outer card chrome when nested inside admin billing section card. */
  embedded?: boolean;
}
