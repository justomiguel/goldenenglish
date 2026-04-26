"use client";

import { Archive, ArchiveRestore, Check, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import {
  archiveAcademicCohortAction,
  unarchiveAcademicCohortAction,
  deleteAcademicCohortAction,
} from "@/app/[locale]/dashboard/admin/academic/cohortArchiveActions";

export type AcademicCohortLifecycleDict = {
  archivedBanner: string;
  currentCohortHint: string;
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
    is_current: string;
    open_sections: string;
    enrollments_exist: string;
    save: string;
    parse: string;
  };
};

type DialogMode = "archive" | "unarchive" | "delete" | null;

export interface AcademicCohortLifecycleBarProps {
  locale: string;
  cohortId: string;
  cohortArchivedAt: string | null;
  isCurrent: boolean;
  dict: AcademicCohortLifecycleDict;
}

export function AcademicCohortLifecycleBar({
  locale,
  cohortId,
  cohortArchivedAt,
  isCurrent,
  dict,
}: AcademicCohortLifecycleBarProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleteAck, setDeleteAck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArchived = cohortArchivedAt != null;

  function closeAll() {
    setDialog(null);
    setDeleteAck(false);
    setError(null);
  }

  function runArchive() {
    setError(null);
    start(async () => {
      const r = await archiveAcademicCohortAction({ locale, cohortId });
      if (!r.ok) {
        const code =
          r.code === "is_current"
            ? "is_current"
            : r.code === "open_sections"
              ? "open_sections"
              : r.code === "parse"
                ? "parse"
                : "save";
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
      const r = await unarchiveAcademicCohortAction({ locale, cohortId });
      if (!r.ok) {
        setError(dict.errors[r.code === "parse" ? "parse" : "save"]);
        return;
      }
      closeAll();
      router.refresh();
    });
  }

  function runDelete() {
    setError(null);
    start(async () => {
      const r = await deleteAcademicCohortAction({ locale, cohortId });
      if (!r.ok) {
        const code =
          r.code === "is_current"
            ? "is_current"
            : r.code === "enrollments_exist"
              ? "enrollments_exist"
              : r.code === "parse"
                ? "parse"
                : "save";
        setError(dict.errors[code]);
        return;
      }
      closeAll();
      router.push(`/${locale}/dashboard/admin/academic`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25 p-4">
      {isArchived ? (
        <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">{dict.archivedBanner}</p>
      ) : null}
      {isCurrent ? (
        <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">{dict.currentCohortHint}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!isArchived ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDialog("archive")}
            disabled={isCurrent}
          >
            <Archive className="h-4 w-4 shrink-0" aria-hidden />
            {dict.archiveButton}
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={() => setDialog("unarchive")}>
            <ArchiveRestore className="h-4 w-4 shrink-0" aria-hidden />
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
          disabled={isCurrent}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {dict.deleteButton}
        </Button>
      </div>

      <Modal
        open={dialog === "archive"}
        onOpenChange={(o) => !o && closeAll()}
        titleId="coh-lifecycle-arch"
        title={dict.modalArchiveTitle}
        disableClose={pending}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.modalArchiveBody}</p>
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={closeAll} disabled={pending}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.cancel}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={runArchive} isLoading={pending}>
            {!pending ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.confirm}
          </Button>
        </div>
      </Modal>

      <Modal
        open={dialog === "unarchive"}
        onOpenChange={(o) => !o && closeAll()}
        titleId="coh-lifecycle-unarch"
        title={dict.modalUnarchiveTitle}
        disableClose={pending}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.modalUnarchiveBody}</p>
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={closeAll} disabled={pending}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.cancel}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={runUnarchive} isLoading={pending}>
            {!pending ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.confirm}
          </Button>
        </div>
      </Modal>

      <Modal
        open={dialog === "delete"}
        onOpenChange={(o) => !o && closeAll()}
        titleId="coh-lifecycle-del"
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
            <X className="h-4 w-4 shrink-0" aria-hidden />
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
            {!pending ? <Trash2 className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.confirm}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
