"use client";

import { useId } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

export interface ConfirmActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  body?: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "destructive";
  busy?: boolean;
  disableClose?: boolean;
  onConfirm: () => void;
}

export function ConfirmActionModal({
  open,
  onOpenChange,
  title,
  description,
  body,
  cancelLabel,
  confirmLabel,
  confirmVariant = "primary",
  busy = false,
  disableClose,
  onConfirm,
}: ConfirmActionModalProps) {
  const titleId = useId();
  const descId = useId();
  const hasBody = Boolean(description || body);

  const destructiveClass =
    "!bg-[var(--color-error)] !text-white hover:!bg-[var(--color-error)]/90 focus-visible:ring-[var(--color-error)]";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={hasBody ? descId : undefined}
      title={title}
      disableClose={disableClose}
    >
      {hasBody ? (
        <div id={descId} className="space-y-2">
          {description ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
          ) : null}
          {body ? <p className="text-sm font-medium text-[var(--color-foreground)]">{body}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="primary"
          className={confirmVariant === "destructive" ? destructiveClass : ""}
          disabled={busy}
          isLoading={busy}
          onClick={onConfirm}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
