"use client";

import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

export interface DeleteUsersConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
}

export function DeleteUsersConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  body,
  cancelLabel,
  confirmLabel,
  busy,
  onConfirm,
}: DeleteUsersConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="del-users-modal-title"
      descriptionId="del-users-modal-desc"
      title={title}
    >
      <p id="del-users-modal-desc" className="text-sm text-[var(--color-muted-foreground)]">
        {description}
      </p>
      <p className="text-sm font-medium text-[var(--color-foreground)]">{body}</p>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          className="!bg-[var(--color-error)] !text-white hover:!bg-[var(--color-error)]/90 focus-visible:ring-[var(--color-error)]"
          disabled={busy}
          isLoading={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
