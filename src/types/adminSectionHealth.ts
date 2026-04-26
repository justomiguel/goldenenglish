import type { SectionContentHealth } from "@/types/learningContent";

export type AdminSectionHealthLearningRoute = {
  mode: "route" | "free_flow" | null;
  routeTitle: string | null;
  /** Steps on the assigned route (0 in free flow or when no route). */
  plannedSteps: number;
  health: SectionContentHealth;
};

export type AdminSectionHealthSnapshot = {
  activeStudents: number;
  effectiveMaxStudents: number;
  capacityUtilizationPct: number | null;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    /** Present + late over all recorded statuses (excused excluded from denominator). */
    ratePct: number | null;
  };
  tasks: {
    instanceCount: number;
    progressRows: number;
    notOpened: number;
    opened: number;
    completed: number;
    /** (opened + completed) / progressRows when progressRows > 0. */
    openOrDonePct: number | null;
    /** completed / progressRows when progressRows > 0. */
    completedPct: number | null;
  };
  payments: {
    activeWithDebt: number;
    activeWithoutDebt: number;
  };
  engagement: {
    sumEngagementPoints: number;
    materialViews30d: number;
    learningEvents30d: number;
  };
  assessments: {
    cohortAssessmentCount: number;
    publishedGradeRows: number;
    /** cohortAssessmentCount * activeStudents when both > 0. */
    expectedSlots: number;
    coveragePct: number | null;
  };
  learningRoute: AdminSectionHealthLearningRoute;
};
