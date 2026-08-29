"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import {
  deleteAcademicSectionAction,
  previewAcademicSectionDeleteAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionArchiveActions";
import type { AcademicSectionLifecycleDict } from "@/types/academicSectionLifecycle";
import type { SectionDeleteEnrollmentPreview } from "@/lib/academics/mapSectionDeleteEnrollmentPreview";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  sectionId: string;
  dict: AcademicSectionLifecycleDict;
  onDeleted: (cohortId: string) => void;
};

export function AcademicSectionDeleteDialog(props: DialogProps) {
  if (!props.open) return null;
  return <AcademicSectionDeleteDialogBody key={props.sectionId} {...props} />;
}

function AcademicSectionDeleteDialogBody({
  onOpenChange,
  locale,
  sectionId,
  dict,
  onDeleted,
}: DialogProps) {
  const [pending, start] = useTransition();
  const [deleteAck, setDeleteAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<SectionDeleteEnrollmentPreview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void previewAcademicSectionDeleteAction({ sectionId }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(dict.errors[r.code === "parse" ? "parse" : "save"]);
        setLoading(false);
        return;
      }
      setEnrollments(r.enrollments);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sectionId, dict.errors]);

  const hasEnrollments = (enrollments?.length ?? 0) > 0;

  function close() {
    if (pending) return;
    onOpenChange(false);
  }

  function runDelete() {
    if (enrollments == null) return;
    setError(null);
    start(async () => {
      const r = await deleteAcademicSectionAction({
        locale,
        sectionId,
        force: enrollments.length > 0,
      });
      if (!r.ok) {
        const code = r.code === "enrollments_exist" ? "enrollments_exist" : r.code === "parse" ? "parse" : "save";
        setError(dict.errors[code]);
        return;
      }
      onOpenChange(false);
      onDeleted(r.cohortId);
    });
  }

  function statusLabel(status: string): string {
    if (status === "active") return dict.enrollmentStatus.active;
    if (status === "dropped") return dict.enrollmentStatus.dropped;
    if (status === "transferred") return dict.enrollmentStatus.transferred;
    if (status === "completed") return dict.enrollmentStatus.completed;
    return status;
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && close()}
      titleId="sec-lifecycle-del"
      title={dict.modalDeleteTitle}
      disableClose={pending}
    >
      {loading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.loadingEnrollments}</p>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {hasEnrollments ? dict.modalDeleteBodyWithEnrollments : dict.modalDeleteBody}
          </p>
          {hasEnrollments && enrollments ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.enrollmentsListHeading}</p>
              <ul className="max-h-48 overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 px-3 py-2">
                {enrollments.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-baseline justify-between gap-3 py-1 text-sm text-[var(--color-foreground)]"
                  >
                    <span>{row.label}</span>
                    <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
                      {statusLabel(row.status)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
              checked={deleteAck}
              onChange={(e) => setDeleteAck(e.target.checked)}
            />
            <span>
              {hasEnrollments ? dict.deleteConfirmCheckboxWithEnrollments : dict.deleteConfirmCheckbox}
            </span>
          </label>
        </>
      )}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {dict.cancel}
        </Button>
        <Button
          type="button"
          variant="destructiveStrong"
          size="sm"
          onClick={runDelete}
          isLoading={pending}
          disabled={loading || enrollments == null || !deleteAck}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {dict.confirm}
        </Button>
      </div>
    </Modal>
  );
}
