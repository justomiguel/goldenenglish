"use client";

import type { ReactNode } from "react";
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
  /** Controls or inputs between descriptive copy and footer actions (e.g. confirmation forms). */
  formSlot?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "destructive";
  /** When true, the confirm button is not rendered (e.g. until required fields are valid). */
  confirmHidden?: boolean;
  confirmDisabled?: boolean;
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
  formSlot,
  cancelLabel,
  confirmLabel,
  confirmVariant = "primary",
  confirmHidden = false,
  confirmDisabled = false,
  busy = false,
  disableClose,
  onConfirm,
}: ConfirmActionModalProps) {
  const titleId = useId();
  const descId = useId();
  const hasBody = Boolean(description || body || formSlot);

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
      closeLabel={cancelLabel}
    >
      {hasBody ? (
        <div id={descId} className="space-y-2">
          {description ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
          ) : null}
          {body ? <p className="text-sm font-medium text-[var(--color-foreground)]">{body}</p> : null}
          {formSlot ? <div className="space-y-3 pt-1">{formSlot}</div> : null}
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
        {!confirmHidden ? (
          <Button
            type="button"
            variant="primary"
            className={confirmVariant === "destructive" ? destructiveClass : ""}
            disabled={busy || confirmDisabled}
            isLoading={busy}
            onClick={onConfirm}
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {confirmLabel}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
