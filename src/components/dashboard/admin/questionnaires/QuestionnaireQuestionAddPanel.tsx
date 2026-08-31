"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { QuestionnaireQuestionPreview } from "@/components/dashboard/admin/questionnaires/QuestionnaireQuestionPreview";
import { addQuestionnaireQuestionAction } from "@/app/[locale]/dashboard/admin/settings/questionnaires/questionActions";
import { QUESTIONNAIRE_QUESTION_TYPES, type QuestionnaireQuestionType } from "@/lib/questionnaires/types";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnaireQuestionAddPanel({
  locale,
  questionnaireId,
  labels,
}: {
  locale: string;
  questionnaireId: string;
  labels: Labels;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<QuestionnaireQuestionType>("text");
  const [prompt, setPrompt] = useState("");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState(["", ""]);
  const needsOptions = type === "single_choice" || type === "multi_choice";

  return (
    <form
      className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await addQuestionnaireQuestionAction({
            locale,
            questionnaireId,
            questionType: type,
            prompt,
            required,
            options,
          });
          if (!result.ok) {
            setError(
              result.code === "publish_options"
                ? labels.errorPublishOptions
                : result.code === "cap"
                  ? labels.errorQuestionCap
                  : labels.errorSave,
            );
            return;
          }
          setPrompt("");
          setOptions(["", ""]);
          setError(null);
        });
      }}
    >
      <h3 className="font-semibold">{labels.addQuestion}</h3>
      <label className="block text-sm">
        <span className="mb-1 block">{labels.typeLabel}</span>
        <select
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as QuestionnaireQuestionType)}
        >
          {QUESTIONNAIRE_QUESTION_TYPES.map((id) => (
            <option key={id} value={id}>
              {labels.types[id]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block">{labels.promptLabel}</span>
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        {labels.requiredLabel}
      </label>
      {needsOptions ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{labels.optionsTitle}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.optionsHint}</p>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                onChange={(e) =>
                  setOptions(options.map((item, i) => (i === index ? e.target.value : item)))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={labels.removeOptionAria}
                onClick={() => setOptions(options.filter((_, i) => i !== index))}
              >
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => setOptions([...options, ""])}>
            {labels.addOption}
          </Button>
        </div>
      ) : null}
      <QuestionnaireQuestionPreview type={type} prompt={prompt} options={options} labels={labels} />
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        {labels.addQuestion}
      </Button>
    </form>
  );
}
