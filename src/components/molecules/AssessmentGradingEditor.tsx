"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { Dictionary } from "@/types/i18n";
import type { AssessmentMatrixRosterRow } from "@/types/assessmentGrades";
import type { RubricDimensionDef } from "@/types/rubricDimensions";
import {
  publishGradeWithNotification,
  upsertGradeAction,
  type UpsertGradeActionState,
} from "@/app/[locale]/dashboard/teacher/sections/assessmentGradeActions";
import { normalizeRubricValuesForDimensions } from "@/lib/academics/cohortRubricDimensions";
import { suggestedScoreForGrading } from "@/lib/academics/rubricSuggestedScoreFromDimensions";
import { Save, Send, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { GradingForm } from "@/components/molecules/GradingForm";

function DraftSubmitRow({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const statusRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input type="hidden" name="gradeStatus" ref={statusRef} defaultValue="draft" />
      <Button
        type="submit"
        variant="secondary"
        className="min-h-[44px] w-full sm:flex-1"
        isLoading={pending}
        disabled={pending}
        onClick={() => {
          if (statusRef.current) statusRef.current.value = "draft";
        }}
      >
        {!pending ? (
          <Save className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        {label}
      </Button>
    </>
  );
}

export interface AssessmentGradingEditorProps {
  locale: string;
  sectionId: string;
  assessmentId: string;
  maxScore: number;
  dimensions: RubricDimensionDef[];
  row: AssessmentMatrixRosterRow;
  dict: Dictionary["dashboard"]["teacherAssessmentMatrix"];
  onClose: () => void;
  onSaved: (enrollmentId: string, status: "draft" | "published") => void;
}

export function AssessmentGradingEditor({
  locale,
  sectionId,
  assessmentId,
  maxScore,
  dimensions,
  row,
  dict,
  onClose,
  onSaved,
}: AssessmentGradingEditorProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const draftOkFired = useRef(false);
  const norm = normalizeRubricValuesForDimensions(row.rubric, dimensions);
  const hydrated = row.gradeStatus != null || row.score != null;
  const initialSug = suggestedScoreForGrading(norm, dimensions, maxScore);
  const [rubric, setRubric] = useState(() => norm);
  const [scoreStr, setScoreStr] = useState(() =>
    row.score != null && Number.isFinite(row.score) ? String(row.score) : initialSug != null ? String(initialSug) : "0",
  );
  const [scoreLocked, setScoreLocked] = useState(() => hydrated);
  const [feedback, setFeedback] = useState(() => row.teacherFeedback ?? "");
  const [draftState, draftAction] = useActionState(upsertGradeAction, null as UpsertGradeActionState | null);
  const [pubPending, startPub] = useTransition();
  const [pubErr, setPubErr] = useState<string | null>(null);

  const payload = useMemo(() => {
    const rubricPayload: Record<string, number> = {};
    for (const d of dimensions) {
      rubricPayload[d.key] = rubric[d.key] ?? (d.scaleMin + d.scaleMax) / 2;
    }
    const score = Number(scoreStr);
    return JSON.stringify({
      locale,
      sectionId,
      assessmentId,
      enrollmentId: row.enrollmentId,
      score: Number.isFinite(score) ? score : 0,
      rubric: rubricPayload,
      teacherFeedback: feedback.trim() ? feedback.trim() : null,
    });
  }, [assessmentId, dimensions, feedback, locale, row.enrollmentId, rubric, scoreStr, sectionId]);

  useEffect(() => {
    if (!draftState?.ok) {
      draftOkFired.current = false;
      return;
    }
    if (draftOkFired.current) return;
    draftOkFired.current = true;
    onSaved(row.enrollmentId, "draft");
    router.refresh();
  }, [draftState, onSaved, router, row.enrollmentId]);

  const draftErr =
    draftState && !draftState.ok
      ? draftState.code === "validation"
        ? dict.errorValidation
        : draftState.code === "forbidden"
          ? dict.errorForbidden
          : draftState.code === "auth"
            ? dict.errorAuth
            : draftState.code === "score_cap"
              ? dict.errorScoreCap
              : dict.errorSave
      : null;

  const publishErrMsg =
    pubErr === "validation"
      ? dict.errorValidation
      : pubErr === "forbidden"
        ? dict.errorForbidden
        : pubErr === "auth"
          ? dict.errorAuth
          : pubErr === "score_cap"
            ? dict.errorScoreCap
            : pubErr === "save"
              ? dict.errorSave
              : pubErr;

  return (
    <form ref={formRef} action={draftAction}>
      {draftErr ? <p className="mb-3 text-sm text-[var(--color-error)]">{draftErr}</p> : null}
      {publishErrMsg ? <p className="mb-3 text-sm text-[var(--color-error)]">{publishErrMsg}</p> : null}
      <GradingForm
        maxScore={maxScore}
        dimensions={dimensions}
        rubric={rubric}
        setRubric={setRubric}
        scoreStr={scoreStr}
        setScoreStr={setScoreStr}
        scoreLocked={scoreLocked}
        setScoreLocked={setScoreLocked}
        feedback={feedback}
        setFeedback={setFeedback}
        onInsertFeedback={(phrase) => setFeedback((prev) => (prev.trim() ? `${prev.trim()} ${phrase}` : phrase))}
        rubricDict={{
          scoreLabel: dict.rubric.scoreLabel,
          autoHint: dict.rubric.autoHint,
          syncFromRubric: dict.rubric.syncFromRubric,
          feedbackLabel: dict.rubric.feedbackLabel,
        }}
        chipDict={dict.chips}
      />
      <input type="hidden" name="payload" value={payload} readOnly />
      <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row">
        <DraftSubmitRow label={dict.saveDraft} />
        <Button
          type="button"
          className="min-h-[44px] w-full sm:flex-1"
          isLoading={pubPending}
          disabled={pubPending}
          onClick={() => {
            setPubErr(null);
            const el = formRef.current;
            if (!el) return;
            const fd = new FormData(el);
            startPub(() => {
              void publishGradeWithNotification(fd).then((r) => {
                if (r.ok) {
                  onSaved(row.enrollmentId, "published");
                  router.refresh();
                } else {
                  setPubErr(r.ok === false ? r.code : "save");
                }
              });
            });
          }}
        >
          {!pubPending ? (
            <Send className="h-4 w-4 shrink-0" aria-hidden />
          ) : null}
          {dict.publishNotify}
        </Button>
      </div>
      <Button type="button" variant="ghost" className="mt-3 min-h-[44px] w-full" onClick={onClose}>
        <X className="h-4 w-4 shrink-0" aria-hidden />
        {dict.close}
      </Button>
    </form>
  );
}
