import type { StudentExamResult, StudentExamState } from "@/types/studentExams";

export type ExamAssessmentInput = {
  id: string;
  cohortId: string;
  name: string;
  /** `assessment_on`, ISO date. */
  examOn: string;
  maxScore: number | null;
};

export type ExamPublishedGrade = {
  score: number | null;
  hasTeacherFeedback: boolean;
};

export type BuildStudentExamResultsInput = {
  assessments: ExamAssessmentInput[];
  /** Published grades only; a missing entry means "no result to show yet". */
  gradesByAssessmentId: Map<string, ExamPublishedGrade>;
  sectionNameByCohortId: Map<string, string>;
  now: Date;
};

function isoDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}

function resolveState(examOn: string, graded: boolean, today: string): StudentExamState {
  if (graded) return "graded";
  return examOn > today ? "upcoming" : "pending";
}

function usableNumber(value: number | null): number | null {
  return value != null && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * The family view of a cohort's exams: every exam the student's cohort has, newest first, each
 * carrying its result when one has been published.
 *
 * Exams without a published grade are kept on purpose — before this, an evaluación a teacher had
 * created but not yet graded was invisible to families everywhere except the calendar.
 */
export function buildStudentExamResults({
  assessments,
  gradesByAssessmentId,
  sectionNameByCohortId,
  now,
}: BuildStudentExamResultsInput): StudentExamResult[] {
  const today = isoDay(now);

  return [...assessments]
    .sort((a, b) => b.examOn.localeCompare(a.examOn))
    .map((assessment) => {
      const grade = gradesByAssessmentId.get(assessment.id);
      return {
        id: assessment.id,
        name: assessment.name,
        sectionName: sectionNameByCohortId.get(assessment.cohortId) ?? "",
        examOn: assessment.examOn,
        maxScore: usableNumber(assessment.maxScore),
        score: grade?.score ?? null,
        hasTeacherFeedback: grade?.hasTeacherFeedback ?? false,
        state: resolveState(assessment.examOn, Boolean(grade), today),
      };
    });
}
