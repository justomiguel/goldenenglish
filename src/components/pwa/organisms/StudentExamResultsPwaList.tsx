import { CalendarX2, MessageSquareText } from "lucide-react";
import type { StudentExamResult } from "@/types/studentExams";
import {
  buildStudentExamMetaParts,
  formatStudentExamScore,
  studentExamStateHint,
  type StudentExamCopy,
} from "@/lib/parent/formatStudentExamLabels";
import { StudentExamStateChip } from "@/components/molecules/StudentExamStateChip";

export interface StudentExamResultsPwaListProps {
  locale: string;
  exams: StudentExamResult[];
  copy: StudentExamCopy;
}

/**
 * Touch-first counterpart of `StudentExamResultsDesktop`: the score leads each row so a parent
 * checking their phone gets the answer without reading a line of text.
 */
export function StudentExamResultsPwaList({
  locale,
  exams,
  copy,
}: StudentExamResultsPwaListProps) {
  if (exams.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{copy.title}</h2>
        <div className="flex flex-col items-center gap-2 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center">
          <CalendarX2 className="h-6 w-6 text-[var(--color-muted-foreground)]" aria-hidden />
          <p className="text-sm font-medium text-[var(--color-foreground)]">{copy.empty}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.emptyHint}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{copy.title}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
      </div>
      <ul aria-label={copy.listAria} className="space-y-2">
        {exams.map((exam) => {
          const score = formatStudentExamScore(exam, copy);
          const hint = studentExamStateHint(exam.state, copy);
          return (
            <li
              key={exam.id}
              className="flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                  score
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                }`}
                aria-label={score?.ariaLabel}
              >
                {score ? score.label : "—"}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                  {exam.name}
                </p>
                <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                  {buildStudentExamMetaParts(exam, locale).join(" · ")}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StudentExamStateChip state={exam.state} copy={copy} />
                  {exam.hasTeacherFeedback ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                      <MessageSquareText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {copy.commentHint}
                    </span>
                  ) : null}
                </div>
                {hint ? (
                  <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
