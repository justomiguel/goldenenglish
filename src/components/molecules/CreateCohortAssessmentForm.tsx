"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { Dictionary } from "@/types/i18n";
import {
  createCohortAssessmentAction,
  type CreateAssessmentActionState,
} from "@/app/[locale]/dashboard/teacher/sections/assessmentGradeActions";
import { Button } from "@/components/atoms/Button";

function CreateSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="min-h-[44px]" isLoading={pending} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export interface CreateCohortAssessmentFormProps {
  locale: string;
  sectionId: string;
  defaultDate: string;
  dict: Dictionary["dashboard"]["teacherAssessmentList"];
}

export function CreateCohortAssessmentForm({ locale, sectionId, defaultDate, dict }: CreateCohortAssessmentFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [assessmentOn, setAssessmentOn] = useState(defaultDate);
  const [maxScore, setMaxScore] = useState("10");
  const [state, formAction] = useActionState(createCohortAssessmentAction, null as CreateAssessmentActionState | null);
  const navigated = useRef(false);

  useEffect(() => {
    if (!state?.ok || navigated.current) return;
    navigated.current = true;
    router.push(`/${locale}/dashboard/teacher/sections/${sectionId}/assessments/${state.assessmentId}`);
  }, [locale, router, sectionId, state]);

  useEffect(() => {
    if (!state || state.ok) return;
    navigated.current = false;
  }, [state]);

  const payload = useMemo(
    () =>
      JSON.stringify({
        locale,
        sectionId,
        name: name.trim(),
        assessmentOn,
        maxScore: Number(maxScore),
      }),
    [assessmentOn, locale, maxScore, name, sectionId],
  );

  const err =
    state && !state.ok
      ? state.code === "validation"
        ? dict.errorValidation
        : state.code === "forbidden"
          ? dict.errorForbidden
          : state.code === "auth"
            ? dict.errorAuth
            : dict.errorSave
      : null;

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{dict.createTitle}</h2>
      {err ? <p className="text-sm text-[var(--color-error)]">{err}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="new-asmt-name">
            {dict.nameLabel}
          </label>
          <input
            id="new-asmt-name"
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="new-asmt-date">
            {dict.dateLabel}
          </label>
          <input
            id="new-asmt-date"
            type="date"
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={assessmentOn}
            onChange={(e) => setAssessmentOn(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="new-asmt-max">
            {dict.maxScoreLabel}
          </label>
          <input
            id="new-asmt-max"
            type="number"
            min={1}
            max={100}
            step={0.5}
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            required
          />
        </div>
      </div>
      <input type="hidden" name="payload" value={payload} readOnly />
      <CreateSubmit label={dict.createSubmit} pendingLabel={dict.creating} />
    </form>
  );
}
