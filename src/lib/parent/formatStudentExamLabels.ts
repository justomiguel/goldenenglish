import type { Dictionary } from "@/types/i18n";
import type { StudentExamResult, StudentExamState } from "@/types/studentExams";
import { formatParentFeedbackDate } from "@/lib/parent/formatParentFeedbackLabels";

export type StudentExamCopy = Dictionary["dashboard"]["parent"]["exams"];

export type StudentExamScoreLabel = {
  label: string;
  ariaLabel: string;
};

/** Shares the feedback formatter so an exam reads the same date on both screens. */
export function formatStudentExamDate(examOn: string, locale: string): string {
  return formatParentFeedbackDate(examOn, locale);
}

export function studentExamStateLabel(state: StudentExamState, copy: StudentExamCopy): string {
  if (state === "graded") return copy.stateGraded;
  return state === "upcoming" ? copy.stateUpcoming : copy.statePending;
}

/** The one-line explanation under an exam that carries no score yet. */
export function studentExamStateHint(
  state: StudentExamState,
  copy: StudentExamCopy,
): string | null {
  if (state === "graded") return null;
  return state === "upcoming" ? copy.upcomingHint : copy.pendingHint;
}

export function formatStudentExamScore(
  exam: Pick<StudentExamResult, "score" | "maxScore">,
  copy: StudentExamCopy,
): StudentExamScoreLabel | null {
  if (exam.score == null) return null;
  const score = String(exam.score);
  if (exam.maxScore == null) {
    return { label: score, ariaLabel: copy.scoreOnlyAria.replace("{score}", score) };
  }
  const max = String(exam.maxScore);
  return {
    label: copy.scoreLine.replace("{score}", score).replace("{max}", max),
    ariaLabel: copy.scoreAria.replace("{score}", score).replace("{max}", max),
  };
}

/** Section / date fragments, already filtered so callers can join them directly. */
export function buildStudentExamMetaParts(
  exam: Pick<StudentExamResult, "sectionName" | "examOn">,
  locale: string,
): string[] {
  return [exam.sectionName.trim(), formatStudentExamDate(exam.examOn, locale)].filter(Boolean);
}
