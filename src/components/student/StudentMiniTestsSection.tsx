"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { submitStudentMiniTestAction } from "@/app/[locale]/dashboard/student/assessments/actions";
import type { Dictionary } from "@/types/i18n";
import type { StudentMiniTestAssessment } from "@/types/learningContent";

interface StudentMiniTestsSectionProps {
  locale: string;
  assessments: StudentMiniTestAssessment[];
  labels: Dictionary["dashboard"]["student"];
}

type AnswerState = Record<string, boolean>;

export function StudentMiniTestsSection({
  locale,
  assessments,
  labels,
}: StudentMiniTestsSectionProps) {
  if (assessments.length === 0) {
    return (
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <h1 className="text-xl font-semibold text-[var(--color-foreground)]">{labels.miniTestsTitle}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{labels.miniTestsEmpty}</p>
      </section>
    );
  }
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.miniTestsTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.miniTestsLead}</p>
      </header>
      {assessments.map((assessment) => (
        <MiniTestCard key={assessment.id} locale={locale} assessment={assessment} labels={labels} />
      ))}
    </div>
  );
}

function MiniTestCard({
  locale,
  assessment,
  labels,
}: {
  locale: string;
  assessment: StudentMiniTestAssessment;
  labels: Dictionary["dashboard"]["student"];
}) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<string | null>(assessment.latestAttemptStatus);
  const [isPending, startTransition] = useTransition();
  const isComplete = assessment.questions.every((question) => question.id in answers);

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{assessment.title}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{assessment.sectionName}</p>
        </div>
        {result ? (
          <span className="rounded-full border border-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
            {labels.miniTestsSubmitted}
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        {assessment.questions.map((question) => (
          <fieldset key={question.id} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3">
            <legend className="px-1 text-sm font-medium text-[var(--color-foreground)]">{question.prompt}</legend>
            <div className="mt-2 flex gap-4 text-sm text-[var(--color-foreground)]">
              <label className="flex min-h-[44px] items-center gap-2">
                <input
                  type="radio"
                  name={`${assessment.id}:${question.id}`}
                  checked={answers[question.id] === true}
                  onChange={() => setAnswers((current) => ({ ...current, [question.id]: true }))}
                />
                {labels.trueLabel}
              </label>
              <label className="flex min-h-[44px] items-center gap-2">
                <input
                  type="radio"
                  name={`${assessment.id}:${question.id}`}
                  checked={answers[question.id] === false}
                  onChange={() => setAnswers((current) => ({ ...current, [question.id]: false }))}
                />
                {labels.falseLabel}
              </label>
            </div>
          </fieldset>
        ))}
      </div>
      <Button
        type="button"
        className="mt-4"
        isLoading={isPending}
        disabled={!isComplete}
        onClick={() => startTransition(async () => {
          const response = await submitStudentMiniTestAction({
            locale,
            assessmentId: assessment.id,
            answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
          });
          if (response.ok) setResult(response.passed ? labels.miniTestsPassed : labels.miniTestsNeedsReview);
        })}
      >
        {labels.submitMiniTest}
      </Button>
      {result ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{result}</p> : null}
    </section>
  );
}
