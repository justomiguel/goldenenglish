"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { reviewAssessmentAttemptAction } from "@/app/[locale]/dashboard/teacher/sections/[sectionId]/contents/reviewActions";
import type { Dictionary } from "@/types/i18n";
import type { TeacherAssessmentAttemptReview } from "@/types/learningContent";

interface TeacherAssessmentAttemptsPanelProps {
  locale: string;
  sectionId: string;
  attempts: TeacherAssessmentAttemptReview[];
  labels: Dictionary["dashboard"]["teacherContent"];
}

export function TeacherAssessmentAttemptsPanel({
  locale,
  sectionId,
  attempts,
  labels,
}: TeacherAssessmentAttemptsPanelProps) {
  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.attemptReviewTitle}</h2>
      {attempts.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.attemptReviewEmpty}</p>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <AttemptReviewCard
              key={attempt.id}
              locale={locale}
              sectionId={sectionId}
              attempt={attempt}
              labels={labels}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AttemptReviewCard({
  locale,
  sectionId,
  attempt,
  labels,
}: {
  locale: string;
  sectionId: string;
  attempt: TeacherAssessmentAttemptReview;
  labels: Dictionary["dashboard"]["teacherContent"];
}) {
  const [score, setScore] = useState(attempt.score?.toString() ?? "");
  const [passed, setPassed] = useState<boolean | null>(attempt.passed);
  const [teacherApproved, setTeacherApproved] = useState(true);
  const [teacherFeedback, setTeacherFeedback] = useState(attempt.teacherFeedback);
  const [isPending, startTransition] = useTransition();
  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[var(--color-foreground)]">{attempt.studentLabel}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{attempt.assessmentTitle}</p>
        </div>
        <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted-foreground)]">
          {attempt.status}
        </span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[8rem_1fr]">
        <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} placeholder={labels.reviewScore} />
        <Input value={teacherFeedback} onChange={(e) => setTeacherFeedback(e.target.value)} placeholder={labels.reviewFeedback} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-foreground)]">
        <label className="flex items-center gap-2">
          <input type="radio" checked={passed === true} onChange={() => setPassed(true)} />
          {labels.reviewPassed}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={passed === false} onChange={() => setPassed(false)} />
          {labels.reviewNeedsSupport}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={teacherApproved} onChange={(e) => setTeacherApproved(e.target.checked)} />
          {labels.readyCheckbox}
        </label>
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        isLoading={isPending}
        onClick={() => startTransition(() => void reviewAssessmentAttemptAction({
          locale,
          sectionId,
          attemptId: attempt.id,
          studentId: attempt.studentId,
          score: score ? Number(score) : undefined,
          passed,
          teacherFeedback,
          teacherApproved,
        }))}
      >
        {!isPending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.saveReview}
      </Button>
    </div>
  );
}
