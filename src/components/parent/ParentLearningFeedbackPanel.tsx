import type { Dictionary } from "@/types/i18n";
import type { ParentLearningFeedbackRow } from "@/lib/learning-content/loadParentLearningFeedback";

interface ParentLearningFeedbackPanelProps {
  rows: ParentLearningFeedbackRow[];
  labels: Dictionary["dashboard"]["parent"];
  selectedStudentId?: string;
}

export function ParentLearningFeedbackPanel({
  rows,
  labels,
  selectedStudentId,
}: ParentLearningFeedbackPanelProps) {
  const visible = selectedStudentId ? rows.filter((row) => row.studentId === selectedStudentId) : rows;
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{labels.learningFeedbackTitle}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.learningFeedbackLead}</p>
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.learningFeedbackEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {visible.map((row) => (
            <li key={row.id} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
              <p className="font-medium text-[var(--color-foreground)]">{row.childLabel}: {row.title}</p>
              <p className="mt-1 text-[var(--color-muted-foreground)]">
                {row.score != null ? labels.learningFeedbackScore.replace("{score}", String(row.score)) : row.diagnosticLabel ?? labels.emptyValue}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
