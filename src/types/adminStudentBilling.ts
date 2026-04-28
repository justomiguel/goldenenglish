export type AdminBillingPaymentRow = {
  id: string;
  month: number;
  year: number;
  amount: number | null;
  status: string;
  section_id: string | null;
  admin_notes: string | null;
  updated_at: string;
  receiptSignedUrl: string | null;
};

import type { SectionScheduleSlot } from "@/types/academics";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

export type AdminBillingScholarship = {
  id: string;
  discount_percent: number;
  note: string | null;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

export type AdminStudentBillingSectionBenefit = {
  enrollmentId: string;
  sectionId: string;
  sectionName: string;
  /** Section-listed enrollment fee (>0 means this section charges a fee). */
  sectionEnrollmentFeeAmount: number;
  /** Base monthly fee from `section_fee_plans` effective for load-time reference period (see loader). */
  sectionMonthlyFeeAmount: number | null;
  /** ISO 4217 currency for `sectionMonthlyFeeAmount` (also used to format enrollment fee when known). */
  sectionMonthlyFeeCurrency: string | null;
  /** Section operational window for enrollment overdue rules. */
  sectionStartsOn: string;
  sectionEndsOn: string;
  /** Enrollment row `created_at` (ISO) for overdue rules. */
  enrollmentCreatedAt: string | null;
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
  scholarships: AdminBillingScholarship[];
  /** Pre-signed URL for the student-uploaded enrollment fee receipt. */
  enrollmentFeeReceiptSignedUrl: string | null;
  /** Review status of the enrollment fee receipt: pending | approved | rejected. */
  enrollmentFeeReceiptStatus: "pending" | "approved" | "rejected" | null;
  /** Plans for this section (aligned with Cobranzas matrix). */
  feePlans: SectionFeePlan[];
  scheduleSlots: SectionScheduleSlot[];
  cohortName: string;
};

export type AdminStudentBillingTabData = {
  payments: AdminBillingPaymentRow[];
  scholarships: AdminBillingScholarship[];
  sectionBenefits: AdminStudentBillingSectionBenefit[];
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
};
