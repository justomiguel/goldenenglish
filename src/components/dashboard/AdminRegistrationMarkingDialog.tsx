"use client";

import { Modal } from "@/components/atoms/Modal";

export function AdminRegistrationMarkingDialog({
  open,
  titleId,
  title,
  body,
  error,
  onClose,
}: {
  open: boolean;
  titleId: string;
  title: string;
  body: string;
  error?: string | null;
  onClose?: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      titleId={titleId}
      title={title}
      disableClose={!error}
    >
      {error ? (
        <p className="py-4 text-sm text-[var(--color-foreground)]">{error}</p>
      ) : (
        <div className="flex items-center gap-3 py-4" role="status" aria-busy="true" aria-live="polite">
          <span
            className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
            aria-hidden
          />
          <p className="text-sm text-[var(--color-foreground)]">{body}</p>
        </div>
      )}
    </Modal>
  );
}
