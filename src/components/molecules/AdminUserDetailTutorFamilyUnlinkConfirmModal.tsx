"use client";

import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { AdminUserTutorFamilyStudentVM } from "@/lib/dashboard/adminUserDetailVM";
import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailTutorFamilyUnlinkConfirmModalProps {
  labels: UserLabels;
  unlinkTarget: AdminUserTutorFamilyStudentVM | null;
  unlinkBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AdminUserDetailTutorFamilyUnlinkConfirmModal({
  labels,
  unlinkTarget,
  unlinkBusy,
  onOpenChange,
  onConfirm,
}: AdminUserDetailTutorFamilyUnlinkConfirmModalProps) {
  return (
    <ConfirmActionModal
      open={unlinkTarget !== null}
      onOpenChange={onOpenChange}
      title={labels.detailTutorFamilyUnlinkConfirmTitle}
      description={labels.detailTutorFamilyUnlinkConfirmDescription}
      formSlot={
        unlinkTarget?.isMinor ? (
          <p className="text-sm font-medium text-[var(--color-error)]">{labels.detailTutorFamilyUnlinkMinorWarning}</p>
        ) : null
      }
      body={unlinkTarget ? `${unlinkTarget.displayName} — ${unlinkTarget.emailDisplay}` : undefined}
      cancelLabel={labels.detailTutorCreateCancel}
      confirmLabel={labels.detailTutorFamilyUnlinkStudent}
      confirmVariant="destructive"
      busy={unlinkBusy}
      disableClose={unlinkBusy}
      onConfirm={() => void onConfirm()}
    />
  );
}
