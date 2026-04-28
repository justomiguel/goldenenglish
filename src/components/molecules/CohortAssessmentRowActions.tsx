"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Pencil, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { deleteCohortAssessmentAction } from "@/app/[locale]/dashboard/teacher/sections/deleteCohortAssessmentAction";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import {
  CohortAssessmentEditModal,
  type CohortAssessmentRowModel,
} from "@/components/molecules/CohortAssessmentEditModal";

type PanelDict = Dictionary["dashboard"]["academicSectionPage"]["assessmentsPanel"];

export type { CohortAssessmentRowModel };

export interface CohortAssessmentRowActionsProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  row: CohortAssessmentRowModel;
  /** When set, rubric matrix link includes returnTo (admin section tab). */
  rubricReturnTo: string | null;
  canDelete: boolean;
  dict: PanelDict;
}

export function CohortAssessmentRowActions({
  locale,
  cohortId,
  sectionId,
  row,
  rubricReturnTo,
  canDelete,
  dict: d,
}: CohortAssessmentRowActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const deletePayload = useMemo(
    () =>
      JSON.stringify({
        locale,
        sectionId,
        cohortId,
        assessmentId: row.id,
      }),
    [row.id, cohortId, locale, sectionId],
  );

  const matrixHref =
    rubricReturnTo != null
      ? `/${locale}/dashboard/teacher/sections/${sectionId}/assessments/${row.id}?returnTo=${encodeURIComponent(rubricReturnTo)}`
      : `/${locale}/dashboard/teacher/sections/${sectionId}/assessments/${row.id}`;

  const mapDeleteErr = (code: string) =>
    code === "validation"
      ? d.deleteErrorValidation
      : code === "forbidden"
        ? d.deleteErrorForbidden
        : code === "auth"
          ? d.deleteErrorAuth
          : d.deleteErrorSave;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={matrixHref}
        className="inline-flex min-h-[44px] min-w-0 items-center justify-end gap-2 break-words font-medium text-[var(--color-primary)] hover:underline"
      >
        <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
        {d.openMatrix}
      </Link>
      <Button
        type="button"
        variant="ghost"
        className="min-h-[44px] shrink-0"
        aria-label={d.editAssessmentAria.replace("{name}", row.name)}
        onClick={() => {
          setLocalErr(null);
          setEditOpen(true);
        }}
      >
        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
        {d.editAssessment}
      </Button>
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-[44px] shrink-0 text-[var(--color-error)] hover:bg-[var(--color-muted)]/60"
          aria-label={d.deleteAssessmentAria.replace("{name}", row.name)}
          onClick={() => {
            setLocalErr(null);
            setConfirmOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {d.deleteAssessment}
        </Button>
      ) : null}
      <CohortAssessmentEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        locale={locale}
        sectionId={sectionId}
        cohortId={cohortId}
        row={row}
        dict={d}
        onSaved={() => router.refresh()}
      />
      {canDelete ? (
        <ConfirmActionModal
          open={confirmOpen}
          onOpenChange={(o) => {
            if (!pending) setConfirmOpen(o);
          }}
          title={d.deleteConfirmTitle}
          description={d.deleteConfirmDescription}
          body={d.deleteConfirmBody.replace("{name}", row.name)}
          cancelLabel={d.deleteCancel}
          confirmLabel={d.deleteConfirm}
          confirmVariant="destructive"
          busy={pending}
          disableClose={pending}
          onConfirm={() => {
            setLocalErr(null);
            const fd = new FormData();
            fd.set("payload", deletePayload);
            startTransition(() => {
              void deleteCohortAssessmentAction(null, fd).then((r) => {
                if (r.ok) {
                  setConfirmOpen(false);
                  setLocalErr(null);
                  router.refresh();
                } else {
                  setLocalErr(mapDeleteErr(r.code));
                }
              });
            });
          }}
        />
      ) : null}
      {localErr ? (
        <p className="w-full text-right text-sm text-[var(--color-error)]" role="alert">
          {localErr}
        </p>
      ) : null}
    </div>
  );
}
