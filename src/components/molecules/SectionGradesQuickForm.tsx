"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { Dictionary } from "@/types/i18n";
import {
  submitSectionGradeAction,
  type SectionGradeSubmitState,
} from "@/app/[locale]/dashboard/teacher/sections/gradeActions";
import { Button } from "@/components/atoms/Button";

function SubmitFooter({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="min-h-[48px] w-full sm:w-auto" isLoading={pending} disabled={pending}>
      {label}
    </Button>
  );
}

const RUBRIC_KEYS = ["speaking", "grammar", "vocabulary", "listening", "participation"] as const;

export interface SectionGradesQuickFormProps {
  locale: string;
  sectionId: string;
  students: { enrollmentId: string; label: string }[];
  dict: Dictionary["dashboard"]["teacherSectionGrades"];
}

export function SectionGradesQuickForm({ locale, sectionId, students, dict }: SectionGradesQuickFormProps) {
  const router = useRouter();
  const [enrollmentId, setEnrollmentId] = useState(students[0]?.enrollmentId ?? "");
  const [assessmentName, setAssessmentName] = useState("");
  const [score, setScore] = useState("8");
  const [feedback, setFeedback] = useState("");
  const [rubric, setRubric] = useState<Record<string, number>>(() =>
    Object.fromEntries(RUBRIC_KEYS.map((k) => [k, 3])),
  );
  const [state, formAction] = useActionState(submitSectionGradeAction, null as SectionGradeSubmitState | null);
  const fired = useRef(false);

  useEffect(() => {
    if (!state?.ok) {
      fired.current = false;
      return;
    }
    if (fired.current) return;
    fired.current = true;
    queueMicrotask(() => {
      setAssessmentName("");
      setFeedback("");
      setRubric(Object.fromEntries(RUBRIC_KEYS.map((k) => [k, 3])));
      router.refresh();
    });
  }, [state, router]);

  const rubricLabels = dict.rubricLabels;

  const payload = useMemo(() => {
    const num = Number(score);
    const rubricPayload: Record<string, number> = {};
    for (const k of RUBRIC_KEYS) {
      rubricPayload[k] = rubric[k] ?? 3;
    }
    return JSON.stringify({
      locale,
      sectionId,
      enrollmentId,
      assessmentName,
      score: Number.isFinite(num) ? num : 0,
      feedback: feedback.trim() ? feedback : null,
      rubric: rubricPayload,
    });
  }, [assessmentName, enrollmentId, feedback, locale, rubric, score, sectionId]);

  const errMsg =
    state && !state.ok
      ? state.code === "validation"
        ? dict.errorValidation
        : state.code === "forbidden"
          ? dict.errorForbidden
          : state.code === "save"
            ? dict.errorSave
            : dict.errorAuth
      : null;

  if (students.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.emptyStudents}</p>;
  }

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <input type="hidden" name="payload" value={payload} readOnly />

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="grade-student">
          {dict.studentLabel}
        </label>
        <select
          id="grade-student"
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-base"
          value={enrollmentId}
          onChange={(e) => setEnrollmentId(e.target.value)}
        >
          {students.map((s) => (
            <option key={s.enrollmentId} value={s.enrollmentId}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="grade-assessment">
          {dict.assessmentLabel}
        </label>
        <input
          id="grade-assessment"
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-base"
          value={assessmentName}
          onChange={(e) => setAssessmentName(e.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="grade-score">
          {dict.scoreLabel}
        </label>
        <input
          id="grade-score"
          type="number"
          min={0}
          max={10}
          step={0.5}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-base"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
      </div>

      <fieldset className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-4">
        <legend className="px-1 text-sm font-medium text-[var(--color-foreground)]">{dict.rubricLegend}</legend>
        {RUBRIC_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-[var(--color-foreground)]">{rubricLabels[key]}</span>
            <select
              className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm sm:max-w-[200px]"
              value={String(rubric[key] ?? 3)}
              onChange={(e) =>
                setRubric((prev) => ({
                  ...prev,
                  [key]: Number(e.target.value),
                }))
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="grade-feedback">
          {dict.feedbackLabel}
        </label>
        <textarea
          id="grade-feedback"
          rows={3}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={4000}
        />
      </div>

      {errMsg ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {errMsg}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-[var(--color-primary)]">
          {dict.savedOk}
        </p>
      ) : null}

      <SubmitFooter label={dict.submit} />
    </form>
  );
}
