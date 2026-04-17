"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import {
  archiveAcademicSectionAction,
  unarchiveAcademicSectionAction,
  deleteAcademicSectionAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionArchiveActions";

export type AcademicSectionLifecycleDict = {
  archivedBanner: string;
  cohortArchivedHint: string;
  archiveButton: string;
  unarchiveButton: string;
  deleteButton: string;
  modalArchiveTitle: string;
  modalArchiveBody: string;
  modalUnarchiveTitle: string;
  modalUnarchiveBody: string;
  modalDeleteTitle: string;
  modalDeleteBody: string;
  deleteConfirmCheckbox: string;
  confirm: string;
  cancel: string;
  errors: {
    active_enrollments: string;
    cohort_archived: string;
    enrollments_exist: string;
    save: string;
    parse: string;
  };
};

type DialogMode = "archive" | "unarchive" | "delete" | null;

export interface AcademicSectionLifecycleBarProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  sectionArchivedAt: string | null;
  cohortArchivedAt: string | null;
  dict: AcademicSectionLifecycleDict;
}

export function AcademicSectionLifecycleBar({
  locale,
  sectionId,
  sectionArchivedAt,
  cohortArchivedAt,
  dict,
}: AcademicSectionLifecycleBarProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleteAck, setDeleteAck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSectionArchived = sectionArchivedAt != null;
  const cohortArchived = cohortArchivedAt != null;

  function closeAll() {
    setDialog(null);
    setDeleteAck(false);
    setError(null);
  }

  function runArchive() {
    setError(null);
    start(async () => {
      const r = await archiveAcademicSectionAction({ locale, sectionId });
      if (!r.ok) {
        const code = r.code === "active_enrollments" ? "active_enrollments" : r.code === "parse" ? "parse" : "save";
        setError(dict.errors[code]);
        return;
      }
      closeAll();
      router.refresh();
    });
  }

  function runUnarchive() {
    setError(null);
    start(async () => {
      const r = await unarchiveAcademicSectionAction({ locale, sectionId });
      if (!r.ok) {
        const code =
          r.code === "cohort_archived" ? "cohort_archived" : r.code === "parse" ? "parse" : "save";
        setError(dict.errors[code]);
        return;
      }
      closeAll();
      router.refresh();
    });
  }

  function runDelete() {
    setError(null);
    start(async () => {
      const r = await deleteAcademicSectionAction({ locale, sectionId });
      if (!r.ok) {
        const code = r.code === "enrollments_exist" ? "enrollments_exist" : r.code === "parse" ? "parse" : "save";
        setError(dict.errors[code]);
        return;
      }
      closeAll();
      router.push(`/${locale}/dashboard/admin/academic/${r.cohortId}`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25 p-4">
      {isSectionArchived ? (
        <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">{dict.archivedBanner}</p>
      ) : null}
      {cohortArchived ? (
        <p className="mb-3 text-sm text-[var(--color-error)]">{dict.cohortArchivedHint}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!isSectionArchived ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => setDialog("archive")}>
            {dict.archiveButton}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDialog("unarchive")}
            disabled={cohortArchived}
          >
            {dict.unarchiveButton}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-muted)]"
          onClick={() => {
            setDeleteAck(false);
            setDialog("delete");
          }}
        >
          {dict.deleteButton}
        </Button>
      </div>

      <Modal
        open={dialog === "archive"}
        onOpenChange={(o) => !o && closeAll()}
        titleId="sec-lifecycle-arch"
        title={dict.modalArchiveTitle}
        disableClose={pending}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.modalArchiveBody}</p>
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={closeAll} disabled={pending}>
            {dict.cancel}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={runArchive} isLoading={pending}>
            {dict.confirm}
          </Button>
        </div>
      </Modal>

      <Modal
        open={dialog === "unarchive"}
        onOpenChange={(o) => !o && closeAll()}
        titleId="sec-lifecycle-unarch"
        title={dict.modalUnarchiveTitle}
        disableClose={pending}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.modalUnarchiveBody}</p>
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={closeAll} disabled={pending}>
            {dict.cancel}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={runUnarchive} isLoading={pending}>
            {dict.confirm}
          </Button>
        </div>
      </Modal>

      <Modal
        open={dialog === "delete"}
        onOpenChange={(o) => !o && closeAll()}
        titleId="sec-lifecycle-del"
        title={dict.modalDeleteTitle}
        disableClose={pending}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.modalDeleteBody}</p>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
            checked={deleteAck}
            onChange={(e) => setDeleteAck(e.target.checked)}
          />
          <span>{dict.deleteConfirmCheckbox}</span>
        </label>
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={closeAll} disabled={pending}>
            {dict.cancel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="border border-[var(--color-error)] text-[var(--color-error)]"
            onClick={runDelete}
            isLoading={pending}
            disabled={!deleteAck}
          >
            {dict.confirm}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
