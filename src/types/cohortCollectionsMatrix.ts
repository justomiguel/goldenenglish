import type {
  SectionCollectionsKpis,
  SectionCollectionsView,
} from "@/types/sectionCollections";
import type { SectionFeePlanRowDb } from "@/types/sectionFeePlan";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/buildStudentMonthlyPaymentsRow";

/**
 * Shape returned by the `admin_cohort_collections_bulk` RPC, parsed from JSON.
 * One single object per cohort + year — the application composes per-cell
 * status / expected amounts using the pure reducers under `src/lib/billing/`.
 */
export interface CohortCollectionsBulkRaw {
  cohort: { id: string; name: string } | null;
  year: number;
  sections: CohortCollectionsBulkSectionRaw[];
  enrollments: CohortCollectionsBulkEnrollmentRaw[];
  profiles: CohortCollectionsBulkProfileRaw[];
  payments: CohortCollectionsBulkPaymentRaw[];
  scholarships: CohortCollectionsBulkScholarshipRaw[];
  promotions: CohortCollectionsBulkStudentPromotionRaw[];
  plans: SectionFeePlanRowDb[];
}

export interface CohortCollectionsBulkSectionRaw {
  id: string;
  name: string;
  archived_at: string | null;
  starts_on: string | null;
  ends_on: string | null;
  schedule_slots: unknown;
  enrollment_fee_amount: number | string | null;
}

export interface CohortCollectionsBulkEnrollmentRaw {
  id: string;
  section_id: string;
  student_id: string;
  created_at: string | null;
  enrollment_fee_exempt?: boolean | null;
  enrollment_exempt_reason?: string | null;
  enrollment_fee_receipt_url?: string | null;
  enrollment_fee_receipt_status?: string | null;
  scholarship_discount_percent?: number | string | null;
  scholarship_valid_from_year?: number | null;
  scholarship_valid_from_month?: number | null;
  scholarship_valid_until_year?: number | null;
  scholarship_valid_until_month?: number | null;
  scholarship_is_active?: boolean | null;
}

export interface CohortCollectionsBulkProfileRaw {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dni_or_passport: string | null;
  enrollment_fee_exempt: boolean | null;
  enrollment_exempt_reason: string | null;
}

export interface CohortCollectionsBulkPaymentRaw {
  id: string;
  student_id: string;
  section_id: string | null;
  month: number;
  year: number;
  amount: number | string | null;
  status: StudentMonthlyPaymentRecord["status"];
  receipt_url: string | null;
}

export interface CohortCollectionsBulkScholarshipRaw {
  id: string;
  section_id: string;
  student_id: string;
  discount_percent: number | string;
  note: string | null;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
}

export interface CohortCollectionsBulkStudentPromotionRaw {
  student_id: string;
  code_snapshot: string;
  promotion_snapshot: Record<string, unknown> | null;
  applies_to_snapshot: "enrollment" | "monthly" | "both";
  monthly_months_remaining: number | null;
  enrollment_consumed: boolean | null;
  applied_at: string | null;
}

/**
 * Composed matrix view for the /admin/finance overview tab. One entry per
 * active section of the cohort, each one a full `SectionCollectionsView`
 * ready to be rendered as a horizontal strip of months per student.
 */
export interface CohortCollectionsMatrix {
  cohortId: string;
  cohortName: string;
  year: number;
  todayMonth: number;
  sections: CohortCollectionsMatrixSection[];
  totals: SectionCollectionsKpis;
}

export interface CohortCollectionsMatrixSection {
  view: SectionCollectionsView;
  archivedAt: string | null;
}
