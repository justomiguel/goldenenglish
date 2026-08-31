import type { QuestionnaireQuestionType } from "@/lib/questionnaires/types";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnaireQuestionPreview({
  type,
  prompt,
  options,
  labels,
}: {
  type: QuestionnaireQuestionType;
  prompt: string;
  options: string[];
  labels: Labels;
}) {
  const title = prompt.trim() || labels.previewTitle;
  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
  return (
    <div className="rounded-xl bg-[var(--color-muted)]/40 p-3 text-sm">
      <p className="mb-2 font-medium">{title}</p>
      {type === "textarea" ? (
        <div className="min-h-16 rounded border border-[var(--color-border)] bg-[var(--color-background)]" />
      ) : type === "yes_no" ? (
        <p>
          {labels.yes} / {labels.no}
        </p>
      ) : type === "scale" ? (
        <p>1 · 2 · 3 · 4 · 5</p>
      ) : type === "single_choice" || type === "multi_choice" ? (
        <ul className="list-disc pl-5">
          {cleanOptions.map((option) => (
            <li key={option}>{option}</li>
          ))}
        </ul>
      ) : (
        <div className="h-9 rounded border border-[var(--color-border)] bg-[var(--color-background)]" />
      )}
    </div>
  );
}
