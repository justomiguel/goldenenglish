/** Data for the admin “Evaluaciones” section tab. */

export type AdminSectionLearningAssessmentSummary = {
  id: string;
  title: string;
  assessmentKind: string;
  gradingMode: string;
  passingScore: number | null;
  createdAt: string;
  attemptCount: number;
  reviewedCount: number;
  /** Average score (0–100) across attempts that have a numeric score, or null if none. */
  avgScore: number | null;
  /** Attempts with passed true (when applicable). */
  passedCount: number;
};

export type AdminSectionCohortAssessmentSummary = {
  id: string;
  name: string;
  assessmentOn: string;
  maxScore: number;
  /** Grades in “published” status for enrollments in this section. */
  publishedInSection: number;
};

export type AdminSectionAssessmentsPanelData = {
  learning: AdminSectionLearningAssessmentSummary[];
  cohort: AdminSectionCohortAssessmentSummary[];
  activeEnrollmentCount: number;
};
