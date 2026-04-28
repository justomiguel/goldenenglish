import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

export type SectionCollectionsHealth = "healthy" | "watch" | "critical";

export interface SectionCollectionsKpis {
  /** Sum of recordedAmount on approved cells (year). */
  paid: number;
  /** Sum of pending review cells (recordedAmount or expectedAmount). */
  pendingReview: number;
  /** Sum of in-period due/rejected cells before today. */
  overdue: number;
  /** Sum of in-period due cells from today onward. */
  upcoming: number;
  /** Sum of expectedAmount across all in-period cells of the year. */
  expectedYear: number;
  /** paid / expectedYear, 0 when expectedYear is 0. Always between 0 and 1. */
  collectionRatio: number;
  /** Number of distinct enrolled students with at least one in-period cell. */
  totalStudents: number;
  /** Number of distinct enrolled students with at least one overdue cell. */
  overdueStudents: number;
  /** Health derived from collectionRatio + overdueStudents share. */
  health: SectionCollectionsHealth;
}

export interface SectionCollectionsStudentRow {
  studentId: string;
  studentName: string;
  documentLabel: string | null;
  /** Enrollment timestamp for this section (overdue rules for month 0). */
  enrolledAt: string | null;
  /** Reuse of the per-section row builder so cells match the student strip. */
  row: StudentMonthlyPaymentSectionRow;
  /** Convenience: per-student aggregates over the year. */
  paid: number;
  pendingReview: number;
  overdue: number;
  upcoming: number;
  expectedYear: number;
  hasOverdue: boolean;
  enrollmentFee: {
    amount: number;
    expectedAmount: number;
    exempt: boolean;
    exemptReason: string | null;
  };
  scholarships: Array<{
    id?: string;
    discount_percent: number;
    note?: string | null;
    valid_from_year: number;
    valid_from_month: number;
    valid_until_year: number | null;
    valid_until_month: number | null;
    is_active: boolean;
  }>;
  activeScholarshipDiscountPercent: number | null;
  activePromotionLabel: string | null;
}

export interface SectionCollectionsView {
  sectionId: string;
  sectionName: string;
  cohortId: string;
  cohortName: string;
  year: number;
  todayMonth: number;
  /** ISO dates for enrollment-fee overdue rules (month 0 column). */
  sectionStartsOn: string;
  sectionEndsOn: string;
  students: SectionCollectionsStudentRow[];
  kpis: SectionCollectionsKpis;
}

export interface CohortCollectionsSectionSummary {
  sectionId: string;
  sectionName: string;
  archivedAt: string | null;
  kpis: SectionCollectionsKpis;
}

export interface CohortCollectionsOverview {
  cohortId: string;
  cohortName: string;
  year: number;
  sections: CohortCollectionsSectionSummary[];
  /** Aggregate across all listed sections (paid, expectedYear, etc.). */
  totals: SectionCollectionsKpis;
}

export const SECTION_COLLECTIONS_HEALTH_THRESHOLDS = {
  healthyMinRatio: 0.85,
  criticalMaxRatio: 0.6,
  watchOverdueShare: 0.3,
} as const;

export type SectionCollectionsExportFormat = "csv" | "xlsx";
