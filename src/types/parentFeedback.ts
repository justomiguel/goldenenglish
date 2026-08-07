/**
 * Teacher feedback surfaced to families (parents/tutors) and to the student.
 *
 * Two teacher-side stores feed the same reading surface:
 * - `assessment` — `enrollment_assessment_grades.teacher_feedback` (published cohort rubric exams).
 * - `learning`   — `student_assessment_attempts.teacher_feedback` (learning-route attempt review).
 */
export type ParentFeedbackSource = "assessment" | "learning";

export type ParentFeedbackItem = {
  /** Stable per-source row id, prefixed so ids never collide across sources. */
  id: string;
  source: ParentFeedbackSource;
  studentId: string;
  /** Surname-first display name of the student the feedback belongs to. */
  childLabel: string;
  /** Assessment / mini-test title. */
  title: string;
  /** Section (or other academic context) the assessment belongs to; empty when unknown. */
  contextLabel: string;
  teacherName: string | null;
  /** ISO date (`YYYY-MM-DD`) used for ordering and display. */
  occurredOn: string;
  score: number | null;
  maxScore: number | null;
  /** Non-empty teacher text. Items without text never reach this type. */
  feedback: string;
  /** Written recently enough to deserve a "new" affordance. */
  isNew: boolean;
};

export type ParentFeedbackTimeline = {
  items: ParentFeedbackItem[];
  newCount: number;
};
