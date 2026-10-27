import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import type { StudentExamResult, StudentExamState } from "@/types/studentExams";
import { formatParentFeedbackDate } from "@/lib/parent/formatParentFeedbackLabels";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminStudentAcademicExamsProps {
  locale: string;
  exams: StudentExamResult[];
  labels: UserLabels;
}

function stateLabel(state: StudentExamState, labels: UserLabels): string {
  if (state === "graded") return labels.detailAcademicExamsGraded;
  if (state === "upcoming") return labels.detailAcademicExamsUpcoming;
  return labels.detailAcademicExamsPending;
}

function examHref(locale: string, exam: StudentExamResult): string | null {
  if (!exam.sectionId) return null;
  return `/${locale}/dashboard/teacher/sections/${exam.sectionId}/assessments/${exam.id}`;
}

function scoreLabel(exam: StudentExamResult, labels: UserLabels): string | null {
  if (exam.score == null) return null;
  if (exam.maxScore == null) {
    return labels.detailAcademicNotesScoreOnly.replace("{score}", String(exam.score));
  }
  return labels.detailAcademicNotesScore
    .replace("{score}", String(exam.score))
    .replace("{max}", String(exam.maxScore));
}

export function AdminStudentAcademicExams({
  locale,
  exams,
  labels,
}: AdminStudentAcademicExamsProps) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]">
      <h2 className="border-b border-[var(--color-border)] pb-3 font-display text-lg font-semibold text-[var(--color-primary)]">
        {labels.detailAcademicExamsTitle}
      </h2>
      {exams.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
          {labels.detailAcademicExamsEmpty}
        </p>
      ) : (
        <ol aria-label={labels.detailAcademicExamsListAria} className="mt-4 space-y-4">
          {exams.map((exam) => {
            const score = scoreLabel(exam, labels);
            const href = examHref(locale, exam);
            return (
              <li key={exam.id} className="space-y-1 border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  {href ? (
                    <Link
                      href={href}
                      className="text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                    >
                      {exam.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">{exam.name}</p>
                  )}
                  {score ? (
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{score}</p>
                  ) : (
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      {stateLabel(exam.state, labels)}
                    </p>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {[exam.sectionName.trim(), formatParentFeedbackDate(exam.examOn, locale), exam.score != null ? stateLabel(exam.state, labels) : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
