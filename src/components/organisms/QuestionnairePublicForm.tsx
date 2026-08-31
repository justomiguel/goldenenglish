"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { submitPublicQuestionnaireAction } from "@/app/[locale]/q/[slug]/actions";
import { pickI18n, pickI18nOptions } from "@/lib/questionnaires/pickI18n";
import type { QuestionnaireAnswerInput, QuestionnaireQuestion } from "@/lib/questionnaires/types";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnairePublicForm({
  locale,
  slug,
  questions,
  askEmail,
  labels,
}: {
  locale: string;
  slug: string;
  questions: QuestionnaireQuestion[];
  askEmail: boolean;
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, QuestionnaireAnswerInput>>({});

  function setAnswer(id: string, patch: QuestionnaireAnswerInput) {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await submitPublicQuestionnaireAction({
            locale,
            slug,
            guestEmail,
            answers,
          });
          if (!result.ok) {
            setError(submitError(result.code, labels));
            return;
          }
          router.replace(`/${locale}/q/${slug}?done=1`);
        });
      }}
    >
      {askEmail ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{labels.guestEmail}</span>
          <Input type="email" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
        </label>
      ) : null}
      {questions.map((question) => (
        <fieldset key={question.id} className="space-y-2">
          <legend className="font-medium">
            {pickI18n(question.promptI18n, locale)}
            {question.required ? " *" : ""}
          </legend>
          <QuestionField
            question={question}
            locale={locale}
            labels={labels}
            value={answers[question.id]}
            onChange={(patch) => setAnswer(question.id, patch)}
          />
        </fieldset>
      ))}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}

function QuestionField({
  question,
  locale,
  labels,
  value,
  onChange,
}: {
  question: QuestionnaireQuestion;
  locale: string;
  labels: Labels;
  value?: QuestionnaireAnswerInput;
  onChange: (patch: QuestionnaireAnswerInput) => void;
}) {
  const options = pickI18nOptions(question.optionsI18n, locale);
  switch (question.questionType) {
    case "textarea":
      return (
        <textarea
          className="min-h-24 w-full rounded-[var(--layout-border-radius)] border px-3 py-2 text-sm"
          required={question.required}
          value={value?.valueText ?? ""}
          onChange={(e) => onChange({ valueText: e.target.value })}
        />
      );
    case "yes_no":
      return (
        <div className="flex gap-4">
          {(["yes", "no"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={question.id}
                required={question.required}
                checked={value?.valueText === opt}
                onChange={() => onChange({ valueText: opt })}
              />
              {opt === "yes" ? labels.yes : labels.no}
            </label>
          ))}
        </div>
      );
    case "single_choice":
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={question.id}
                required={question.required}
                checked={value?.valueText === opt}
                onChange={() => onChange({ valueText: opt })}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case "multi_choice":
      return (
        <div className="space-y-2">
          {options.map((opt) => {
            const selected = value?.valueOptions ?? [];
            return (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={(e) =>
                    onChange({
                      valueOptions: e.target.checked
                        ? [...selected, opt]
                        : selected.filter((item) => item !== opt),
                    })
                  }
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    case "scale":
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex flex-col items-center text-sm">
              <input
                type="radio"
                name={question.id}
                required={question.required}
                checked={value?.valueNumber === n}
                onChange={() => onChange({ valueNumber: n })}
              />
              {n}
            </label>
          ))}
        </div>
      );
    case "number":
      return (
        <Input
          type="number"
          required={question.required}
          value={value?.valueNumber ?? ""}
          onChange={(e) => onChange({ valueNumber: e.target.value === "" ? undefined : Number(e.target.value) })}
        />
      );
    default:
      return (
        <Input
          type={
            question.questionType === "email"
              ? "email"
              : question.questionType === "date"
                ? "date"
                : question.questionType === "phone"
                  ? "tel"
                  : "text"
          }
          required={question.required}
          value={value?.valueText ?? ""}
          onChange={(e) => onChange({ valueText: e.target.value })}
        />
      );
  }
}

function submitError(code: string, labels: Labels): string {
  if (code === "login_required") return labels.errorLogin;
  if (code === "already_submitted") return labels.errorAlready;
  if (code === "invalid_option") return labels.errorOption;
  if (code === "closed" || code === "not_found") return labels.errorClosed;
  return labels.errorValidation;
}
