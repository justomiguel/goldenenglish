import { CalendarX2, MessageSquareText } from "lucide-react";
import type { StudentExamResult } from "@/types/studentExams";
import {
  buildStudentExamMetaParts,
  formatStudentExamScore,
  studentExamStateHint,
  type StudentExamCopy,
} from "@/lib/parent/formatStudentExamLabels";
import { StudentExamStateChip } from "@/components/molecules/StudentExamStateChip";

export interface StudentExamResultsDesktopProps {
  locale: string;
  exams: StudentExamResult[];
  copy: StudentExamCopy;
}

/**
 * Pointer-first exam list: name and context on the left, result on the right, so a term's worth of
 * exams is scannable in one pass. The narrow counterpart is `StudentExamResultsPwaList`.
 */
export function StudentExamResultsDesktop({
  locale,
  exams,
  copy,
}: StudentExamResultsDesktopProps) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">{copy.title}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
      </header>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <CalendarX2 className="h-7 w-7 text-[var(--color-muted-foreground)]" aria-hidden />
          <p className="text-sm font-medium text-[var(--color-foreground)]">{copy.empty}</p>
          <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">{copy.emptyHint}</p>
        </div>
      ) : (
        <ul aria-label={copy.listAria} className="space-y-2">
          {exams.map((exam) => {
            const score = formatStudentExamScore(exam, copy);
            const hint = studentExamStateHint(exam.state, copy);
            return (
              <li
                key={exam.id}
                className="flex items-start justify-between gap-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
              >
                <div className="min-w-0 space-y-1">
                  <h3 className="truncate text-base font-semibold text-[var(--color-foreground)]">
                    {exam.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {buildStudentExamMetaParts(exam, locale).join(" · ")}
                  </p>
                  {hint ? (
                    <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
                  ) : null}
                  {exam.hasTeacherFeedback ? (
                    <p className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                      <MessageSquareText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {copy.commentHint}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {score ? (
                    <span
                      className="font-mono text-xl font-bold text-[var(--color-foreground)]"
                      aria-label={score.ariaLabel}
                    >
                      {score.label}
                    </span>
                  ) : null}
                  <StudentExamStateChip state={exam.state} copy={copy} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
