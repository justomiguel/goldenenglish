"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import {
  archiveAcademicSectionAction,
  unarchiveAcademicSectionAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionArchiveActions";
import { AcademicSectionDeleteDialog } from "@/components/organisms/AcademicSectionDeleteDialog";
import type { AcademicSectionLifecycleDict } from "@/types/academicSectionLifecycle";

type DialogMode = "archive" | "unarchive" | "delete" | null;

export interface AcademicSectionLifecycleActionsProps {
  locale: string;
  sectionId: string;
  sectionArchivedAt: string | null;
  cohortArchivedAt: string | null;
  dict: AcademicSectionLifecycleDict;
}

export function AcademicSectionLifecycleActions({
  locale,
  sectionId,
  sectionArchivedAt,
  cohortArchivedAt,
  dict,
}: AcademicSectionLifecycleActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [error, setError] = useState<string | null>(null);

  const isSectionArchived = sectionArchivedAt != null;
  const cohortArchived = cohortArchivedAt != null;

  function closeAll() {
    setDialog(null);
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


  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        {!isSectionArchived ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setDialog("archive")}>
            <Archive className="h-4 w-4 shrink-0" aria-hidden />
            {dict.archiveButton}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDialog("unarchive")}
            disabled={cohortArchived}
          >
            <ArchiveRestore className="h-4 w-4 shrink-0" aria-hidden />
            {dict.unarchiveButton}
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setDialog("delete")}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
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
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.cancel}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={runArchive} isLoading={pending}>
            <Check className="h-4 w-4 shrink-0" aria-hidden />
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
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.cancel}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={runUnarchive} isLoading={pending}>
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {dict.confirm}
          </Button>
        </div>
      </Modal>

      <AcademicSectionDeleteDialog
        open={dialog === "delete"}
        onOpenChange={(o) => {
          if (!o) closeAll();
        }}
        locale={locale}
        sectionId={sectionId}
        dict={dict}
        onDeleted={(cohortId) => {
          closeAll();
          router.push(`/${locale}/dashboard/admin/academic/${cohortId}`);
          router.refresh();
        }}
      />
    </>
  );
}
