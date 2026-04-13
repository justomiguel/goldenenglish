export type EnrollmentAssessmentGradeStatusDb = "draft" | "published";

export type CohortAssessmentRow = {
  id: string;
  name: string;
  assessmentOn: string;
  maxScore: number;
};

export type AssessmentRosterRow = {
  enrollmentId: string;
  studentLabel: string;
  gradeStatus: EnrollmentAssessmentGradeStatusDb | null;
};

/** Roster row for the rubric grading matrix (one cohort assessment). */
export type AssessmentMatrixRosterRow = {
  enrollmentId: string;
  studentLabel: string;
  gradeStatus: EnrollmentAssessmentGradeStatusDb | null;
  score: number | null;
  rubric: Record<string, number>;
  teacherFeedback: string | null;
};
