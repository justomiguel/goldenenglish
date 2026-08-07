/** Where an exam stands for one student, from the family's point of view. */
export type StudentExamState = "graded" | "pending" | "upcoming";

export type StudentExamResult = {
  /** `cohort_assessments.id`. */
  id: string;
  name: string;
  sectionName: string;
  /** `assessment_on`, ISO date (YYYY-MM-DD). */
  examOn: string;
  maxScore: number | null;
  /** Only set when a published grade exists. */
  score: number | null;
  hasTeacherFeedback: boolean;
  state: StudentExamState;
};
