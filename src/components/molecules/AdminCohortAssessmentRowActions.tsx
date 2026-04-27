"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { deleteCohortAssessmentAction } from "@/app/[locale]/dashboard/teacher/sections/deleteCohortAssessmentAction";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

type PanelDict = Dictionary["dashboard"]["academicSectionPage"]["assessmentsPanel"];

export interface AdminCohortAssessmentRowActionsProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  assessmentId: string;
  assessmentName: string;
  rubricReturnTo: string;
  dict: PanelDict;
}

export function AdminCohortAssessmentRowActions({
  locale,
  cohortId,
  sectionId,
  assessmentId,
  assessmentName,
  rubricReturnTo,
  dict: d,
}: AdminCohortAssessmentRowActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const payload = useMemo(
    () =>
      JSON.stringify({
        locale,
        sectionId,
        cohortId,
        assessmentId,
      }),
    [assessmentId, cohortId, locale, sectionId],
  );

  const mapErr = (code: string) =>
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
        href={`/${locale}/dashboard/teacher/sections/${sectionId}/assessments/${assessmentId}?returnTo=${encodeURIComponent(
          rubricReturnTo,
        )}`}
        className="inline-flex min-h-[44px] min-w-0 items-center justify-end gap-2 break-words font-medium text-[var(--color-primary)] hover:underline"
      >
        <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
        {d.openMatrix}
      </Link>
      <Button
        type="button"
        variant="ghost"
        className="min-h-[44px] shrink-0 text-[var(--color-error)] hover:bg-[var(--color-muted)]/60"
        aria-label={d.deleteAssessmentAria.replace("{name}", assessmentName)}
        onClick={() => {
          setLocalErr(null);
          setConfirmOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        {d.deleteAssessment}
      </Button>
      <ConfirmActionModal
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!pending) setConfirmOpen(o);
        }}
        title={d.deleteConfirmTitle}
        description={d.deleteConfirmDescription}
        body={d.deleteConfirmBody.replace("{name}", assessmentName)}
        cancelLabel={d.deleteCancel}
        confirmLabel={d.deleteConfirm}
        confirmVariant="destructive"
        busy={pending}
        disableClose={pending}
        onConfirm={() => {
          setLocalErr(null);
          const fd = new FormData();
          fd.set("payload", payload);
          startTransition(() => {
            void deleteCohortAssessmentAction(null, fd).then((r) => {
              if (r.ok) {
                setConfirmOpen(false);
                setLocalErr(null);
                router.refresh();
              } else {
                setLocalErr(mapErr(r.code));
              }
            });
          });
        }}
      />
      {localErr ? (
        <p className="w-full text-right text-sm text-[var(--color-error)]" role="alert">
          {localErr}
        </p>
      ) : null}
    </div>
  );
}
