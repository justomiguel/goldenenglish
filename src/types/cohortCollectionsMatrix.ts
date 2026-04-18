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
  section_id: string;
  student_id: string;
  created_at: string | null;
}

export interface CohortCollectionsBulkProfileRaw {
  id: string;
  first_name: string | null;
  last_name: string | null;
  document_number: string | null;
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
  student_id: string;
  discount_percent: number | string;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
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
