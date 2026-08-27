import type { SectionScheduleSlot } from "@/types/academics";
import type { MonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { attachSectionFeePlansUsage } from "@/lib/billing/computeSectionFeePlansUsage";
import type { loadAdminSectionTeachersAndAssistants } from "@/lib/academics/loadAdminSectionTeachersAndAssistants";

export interface AdminSectionRosterRow {
  enrollmentId: string;
  studentId: string;
  label: string;
  status: string;
  /** Marker only: this student has care notes. The text is never loaded here. */
  hasCareNotes: boolean;
}

export interface AdminSectionPageData {
  section: {
    id: string;
    name: string;
    cohortId: string;
    teacherId: string;
    archivedAt: string | null;
    startsOn: string;
    endsOn: string;
    roomLabel: string | null;
    effectiveMaxStudents: number;
    siteDefaultMax: number;
    activeEnrollmentCount: number;
    /**
     * Monto de matrícula a nivel de sección (>=0). 0 = no cobra matrícula.
     * Moneda se reusa del plan vigente.
     */
    enrollmentFeeAmount: number;
    /** Student/parent billing: class prorate vs full month fee. */
    monthlyFeeChargeMode: MonthlyFeeChargeMode;
    allowAdvanceMonthlyPayment: boolean;
    minAttendancePercentOverride: number | null;
    siteDefaultMinAttendancePercent: number;
    /** When true, Assessments tab and evaluation pass rules apply. */
    requiresEvaluationsToPass: boolean;
    /** When true, Learning route tab and route/free-flow progress apply. */
    usesLearningRoute: boolean;
    referenceImageUrl: string | null;
  };
  cohort: {
    name: string;
    archivedAt: string | null;
    label: string;
  };
  slots: SectionScheduleSlot[];
  rows: AdminSectionRosterRow[];
  debtByStudentId: Record<string, boolean>;
  staff: Awaited<ReturnType<typeof loadAdminSectionTeachersAndAssistants>>;
  feePlans: SectionFeePlan[];
  feePlansWithUsage: ReturnType<typeof attachSectionFeePlansUsage>;
  moveTargets: { id: string; label: string }[];
}
