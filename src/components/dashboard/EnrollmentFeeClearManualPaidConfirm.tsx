"use client";

import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";

export interface EnrollmentFeeClearManualPaidConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
}

export function EnrollmentFeeClearManualPaidConfirm({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  busy,
  onConfirm,
}: EnrollmentFeeClearManualPaidConfirmProps) {
  return (
    <ConfirmActionModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      confirmVariant="destructive"
      busy={busy}
      disableClose={busy}
      onConfirm={onConfirm}
    />
  );
}
