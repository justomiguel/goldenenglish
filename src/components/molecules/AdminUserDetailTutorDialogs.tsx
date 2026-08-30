import type { Dictionary } from "@/types/i18n";
import type { AdminUserTutorLinkVM } from "@/lib/dashboard/adminUserDetailVM";
import { AdminUserDetailTutorCreateModal } from "@/components/molecules/AdminUserDetailTutorCreateModal";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

type UserLabels = Dictionary["admin"]["users"];

interface AdminUserDetailTutorDialogsProps {
  locale: string;
  studentId: string;
  isMinor: boolean;
  tutorCount: number;
  labels: UserLabels;
  onFeedback: (message: string, ok: boolean) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  unlinkTarget: AdminUserTutorLinkVM | null;
  onUnlinkTargetChange: (target: AdminUserTutorLinkVM | null) => void;
  unlinkBusy: boolean;
  onConfirmUnlink: () => void;
  onLinked: () => void;
}

export function AdminUserDetailTutorDialogs({
  locale,
  studentId,
  isMinor,
  tutorCount,
  labels,
  onFeedback,
  createOpen,
  onCreateOpenChange,
  unlinkTarget,
  onUnlinkTargetChange,
  unlinkBusy,
  onConfirmUnlink,
  onLinked,
}: AdminUserDetailTutorDialogsProps) {
  return (
    <>
      <AdminUserDetailTutorCreateModal
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        locale={locale}
        studentId={studentId}
        labels={labels}
        onFeedback={onFeedback}
        onLinked={onLinked}
      />
      <ConfirmActionModal
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) onUnlinkTargetChange(null);
        }}
        title={labels.detailTutorUnlinkConfirmTitle}
        description={labels.detailTutorUnlinkConfirmDescription}
        formSlot={
          isMinor && tutorCount === 1 ? (
            <p className="text-sm font-medium text-[var(--color-error)]">{labels.detailTutorUnlinkLastMinorWarning}</p>
          ) : null
        }
        body={unlinkTarget ? `${unlinkTarget.displayName} — ${unlinkTarget.emailDisplay}` : undefined}
        cancelLabel={labels.detailTutorCreateCancel}
        confirmLabel={labels.detailTutorUnlink}
        confirmVariant="destructive"
        busy={unlinkBusy}
        disableClose={unlinkBusy}
        onConfirm={onConfirmUnlink}
      />
    </>
  );
}
