"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { Save, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { updateCohortAssessmentAction } from "@/app/[locale]/dashboard/teacher/sections/updateCohortAssessmentAction";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";

export type CohortAssessmentRowModel = {
  id: string;
  name: string;
  assessmentOn: string;
  maxScore: number;
  createdAt: string;
};

type PanelDict = Dictionary["dashboard"]["academicSectionPage"]["assessmentsPanel"];

export interface CohortAssessmentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  sectionId: string;
  cohortId: string;
  row: CohortAssessmentRowModel;
  dict: PanelDict;
  onSaved: () => void;
}

function CohortAssessmentEditFormFields({
  locale,
  sectionId,
  cohortId,
  row,
  dict: d,
  onOpenChange,
  onSaved,
  isPending,
  startTransition,
}: {
  locale: string;
  sectionId: string;
  cohortId: string;
  row: CohortAssessmentRowModel;
  dict: PanelDict;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [name, setName] = useState(row.name);
  const [assessmentOn, setAssessmentOn] = useState(row.assessmentOn);
  const [maxScore, setMaxScore] = useState(String(row.maxScore));
  const [err, setErr] = useState<string | null>(null);

  const payload = useMemo(
    () =>
      JSON.stringify({
        locale,
        sectionId,
        cohortId,
        assessmentId: row.id,
        name: name.trim(),
        assessmentOn,
        maxScore: Number(maxScore),
      }),
    [assessmentOn, cohortId, locale, maxScore, name, row.id, sectionId],
  );

  const mapErr = (code: string) =>
    code === "validation"
      ? d.editErrorValidation
      : code === "forbidden"
        ? d.editErrorForbidden
        : code === "auth"
          ? d.editErrorAuth
          : code === "max_score_below_grades"
            ? d.editErrorMaxScoreBelowGrades
            : code === "rpc"
              ? d.editErrorRpc
              : d.editErrorSave;

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        const fd = new FormData();
        fd.set("payload", payload);
        startTransition(() => {
          void updateCohortAssessmentAction(null, fd).then((r) => {
            if (r.ok) {
              onOpenChange(false);
              onSaved();
            } else {
              setErr(mapErr(r.code));
            }
          });
        });
      }}
    >
      {err ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {err}
        </p>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor={`ca-name-${row.id}`} required>
          {d.editNameLabel}
        </Label>
        <Input
          id={`ca-name-${row.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`ca-date-${row.id}`} required>
          {d.editDateLabel}
        </Label>
        <Input
          id={`ca-date-${row.id}`}
          type="date"
          value={assessmentOn}
          onChange={(e) => setAssessmentOn(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`ca-max-${row.id}`} required>
          {d.editMaxScoreLabel}
        </Label>
        <Input
          id={`ca-max-${row.id}`}
          type="number"
          min={1}
          max={100}
          step={0.5}
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {d.editCancel}
        </Button>
        <Button type="submit" className="min-h-[44px]" isLoading={isPending} disabled={isPending}>
          <Save className="h-4 w-4 shrink-0" aria-hidden />
          {d.editSave}
        </Button>
      </div>
    </form>
  );
}

export function CohortAssessmentEditModal({
  open,
  onOpenChange,
  locale,
  sectionId,
  cohortId,
  row,
  dict: d,
  onSaved,
}: CohortAssessmentEditModalProps) {
  const titleId = useId();
  const descId = useId();
  const [isPending, startTransition] = useTransition();

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!isPending) onOpenChange(o);
      }}
      titleId={titleId}
      descriptionId={descId}
      title={d.editModalTitle}
      closeLabel={d.editClose}
      disableClose={isPending}
      scrollableBody
      dialogClassName="max-w-lg"
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {d.editModalLead}
      </p>
      <CohortAssessmentEditFormFields
        key={`${row.id}-${row.name}-${row.assessmentOn}-${row.maxScore}`}
        locale={locale}
        sectionId={sectionId}
        cohortId={cohortId}
        row={row}
        dict={d}
        onOpenChange={onOpenChange}
        onSaved={onSaved}
        isPending={isPending}
        startTransition={startTransition}
      />
    </Modal>
  );
}
