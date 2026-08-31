"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { QuestionnaireQuestionPreview } from "@/components/dashboard/admin/questionnaires/QuestionnaireQuestionPreview";
import { updateQuestionnaireQuestionAction } from "@/app/[locale]/dashboard/admin/settings/questionnaires/questionActions";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { pickI18n, pickI18nOptions } from "@/lib/questionnaires/pickI18n";
import { QUESTIONNAIRE_QUESTION_TYPES, type QuestionnaireQuestion, type QuestionnaireQuestionType } from "@/lib/questionnaires/types";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnaireQuestionEditPanel({
  locale,
  questionnaireId,
  question,
  labels,
  onClose,
}: {
  locale: string;
  questionnaireId: string;
  question: QuestionnaireQuestion;
  labels: Labels;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(question.questionType);
  const [prompt, setPrompt] = useState(pickI18n(question.promptI18n, defaultLocale));
  const [required, setRequired] = useState(question.required);
  const [options, setOptions] = useState(() => {
    const current = pickI18nOptions(question.optionsI18n, defaultLocale);
    return current.length >= 2 ? current : ["", ""];
  });
  const needsOptions = type === "single_choice" || type === "multi_choice";

  return (
    <form
      className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateQuestionnaireQuestionAction({
            locale,
            questionnaireId,
            questionId: question.id,
            questionType: type,
            prompt,
            required,
            options,
          });
          if (!result.ok) {
            setError(
              result.code === "shape_locked"
                ? labels.shapeLocked
                : result.code === "publish_options"
                  ? labels.errorPublishOptions
                  : labels.errorSave,
            );
            return;
          }
          onClose();
          router.refresh();
        });
      }}
    >
      <label className="block text-sm">
        <span className="mb-1 block">{labels.typeLabel}</span>
        <select
          className="w-full rounded-[var(--layout-border-radius)] border px-3 py-2"
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
          {options.map((option, index) => (
            <Input
              key={index}
              value={option}
              onChange={(e) =>
                setOptions(options.map((item, i) => (i === index ? e.target.value : item)))
              }
            />
          ))}
          <Button type="button" size="sm" variant="secondary" onClick={() => setOptions([...options, ""])}>
            {labels.addOption}
          </Button>
        </div>
      ) : null}
      <QuestionnaireQuestionPreview type={type} prompt={prompt} options={options} labels={labels} />
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={pending}>
          {labels.saveQuestion}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          {labels.cancelEdit}
        </Button>
      </div>
    </form>
  );
}
