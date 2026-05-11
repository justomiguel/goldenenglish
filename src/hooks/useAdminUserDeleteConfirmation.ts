"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { previewAdminUserDeletionPlan } from "@/app/[locale]/dashboard/admin/users/deleteActions";

type DeleteConfirmationLabels = Pick<
  Dictionary["admin"]["users"],
  "confirmDeleteCascadeGuardians" | "confirmDeleteResolvingNotice"
>;

export type DeletePreviewResolved = {
  orderedIds: string[];
  totalCount: number;
  addedStudentCount: number;
  guardianDeletingCount: number;
  addedStudents: { id: string; label: string }[];
};

function tplGuardianCascade(template: string, guardians: number, linkedStudents: number): string {
  return template
    .replace(/\{\{guardians\}\}/g, String(guardians))
    .replace(/\{\{linkedStudents\}\}/g, String(linkedStudents));
}

/** Server-backed preview when admin bulk-deletes accounts (guardians may expand linked students). */
export function useAdminUserDeleteConfirmation(locale: string, labels: DeleteConfirmationLabels) {
  const [confirmIds, setConfirmIdsState] = useState<string[] | null>(null);
  const [deletePreviewResolved, setDeletePreviewResolved] = useState<DeletePreviewResolved | null>(
    null,
  );
  const [deletePreviewError, setDeletePreviewError] = useState<string | null>(null);

  const dismiss = useCallback(() => {
    setDeletePreviewResolved(null);
    setDeletePreviewError(null);
    setConfirmIdsState(null);
  }, []);

  const beginOrDismiss = useCallback((ids: string[] | null) => {
    setDeletePreviewResolved(null);
    setDeletePreviewError(null);
    setConfirmIdsState(ids);
  }, []);

  useEffect(() => {
    const requested = confirmIds;
    if (!requested?.length) return;
    let cancelled = false;
    void (async () => {
      const res = await previewAdminUserDeletionPlan(locale, requested);
      if (cancelled) return;
      if (!res.ok) {
        setDeletePreviewError(res.message);
        return;
      }
      setDeletePreviewResolved({
        orderedIds: res.orderedIds,
        totalCount: res.totalCount,
        addedStudentCount: res.addedStudentCount,
        guardianDeletingCount: res.guardianDeletingCount,
        addedStudents: res.addedStudents,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [confirmIds, locale]);

  const deleteModalTitleCount = deletePreviewResolved?.totalCount ?? confirmIds?.length ?? 0;

  const deletePreviewBusy = Boolean(
    confirmIds?.length && deletePreviewResolved === null && deletePreviewError === null,
  );

  const cascadeNotice =
    deletePreviewResolved !== null &&
    deletePreviewResolved.addedStudentCount > 0 &&
    deletePreviewResolved.guardianDeletingCount > 0
      ? tplGuardianCascade(
          labels.confirmDeleteCascadeGuardians,
          deletePreviewResolved.guardianDeletingCount,
          deletePreviewResolved.addedStudentCount,
        )
      : undefined;

  const effectiveDeleteIdsOnConfirm =
    deletePreviewResolved?.orderedIds ?? confirmIds ?? ([] as string[]);

  const addedStudentsPreview = deletePreviewResolved?.addedStudents ?? [];

  return {
    confirmIds,
    setConfirmIds: beginOrDismiss,
    dismiss,
    deleteModalTitleCount,
    deletePreviewBusy,
    cascadeNotice,
    previewErrorNotice: deletePreviewError ?? undefined,
    resolvingNoticeLabel: labels.confirmDeleteResolvingNotice,
    effectiveDeleteIdsOnConfirm,
    addedStudentsPreview,
  };
}
