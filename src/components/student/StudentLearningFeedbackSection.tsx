import type { Dictionary } from "@/types/i18n";
import type { LearningFeedbackRow } from "@/types/learningContent";

interface StudentLearningFeedbackSectionProps {
  rows: LearningFeedbackRow[];
  labels: Dictionary["dashboard"]["student"];
}

function resultLine(row: LearningFeedbackRow, labels: Dictionary["dashboard"]["student"]): string {
  if (row.score != null) return labels.learningFeedbackScore.replace("{score}", String(row.score));
  if (row.passed != null) return row.passed ? labels.learningFeedbackPassed : labels.learningFeedbackNeedsSupport;
  return row.diagnosticLabel ?? labels.emptyValue;
}

export function StudentLearningFeedbackSection({
  rows,
  labels,
}: StudentLearningFeedbackSectionProps) {
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.learningFeedbackTitle}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.learningFeedbackLead}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{labels.learningFeedbackEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{row.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{resultLine(row, labels)}</p>
                </div>
                {row.readinessStatus ? (
                  <span className="rounded-full border border-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    {labels.learningReadiness[row.readinessStatus]}
                  </span>
                ) : null}
              </div>
              {row.teacherFeedback ? (
                <p className="mt-2 text-sm text-[var(--color-foreground)]">{row.teacherFeedback}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
