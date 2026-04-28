"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/atoms/Button";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId?: string;
  /** When there is no visible title, use this as the accessible name. */
  ariaLabel?: string;
  title: string;
  children: ReactNode;
  /** When true, Escape does not close the dialog (long-running work in progress). */
  disableClose?: boolean;
  /**
   * Visible label for the header dismiss control (dictionary).
   * Omit when `disableClose` is true.
   */
  closeLabel?: string;
  /**
   * When true, the modal body may scroll. Default false — long workflows belong on a
   * dedicated route / inline panel (see `.cursor/rules/19-modal-ux.mdc`).
   */
  scrollableBody?: boolean;
  /** Tailwind z-index class for stacking above portaled popovers (e.g. `z-[250]`). */
  stackClassName?: string;
  /** Extra classes on the `<dialog>` (e.g. wider modals). */
  dialogClassName?: string;
}

export function Modal({
  open,
  onOpenChange,
  titleId,
  descriptionId,
  ariaLabel,
  title,
  children,
  disableClose,
  closeLabel,
  scrollableBody = false,
  stackClassName = "z-[100]",
  dialogClassName = "",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const showHeaderClose = Boolean(!disableClose && closeLabel);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  function onDialogClose() {
    onOpenChange(false);
  }

  function requestDismiss() {
    if (disableClose) return;
    onOpenChange(false);
  }

  return (
    <dialog
      ref={ref}
      className={`fixed left-1/2 top-1/2 ${stackClassName} max-h-[min(92dvh,48rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-foreground)] shadow-[var(--shadow-card)] ring-2 ring-[var(--color-primary)]/10 open:flex open:flex-col [&::backdrop]:backdrop-blur-md [&::backdrop]:backdrop-saturate-150 [&::backdrop]:bg-[color-mix(in_srgb,var(--color-background)_72%,transparent)] ${dialogClassName}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-label={ariaLabel}
      onClose={onDialogClose}
      onCancel={(e) => {
        if (disableClose) e.preventDefault();
      }}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-muted)]/35 px-4 py-3">
        <h2
          id={titleId}
          className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug text-[var(--color-primary)]"
        >
          {title}
        </h2>
        {showHeaderClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] shrink-0 gap-2 border border-transparent px-3 font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            onClick={requestDismiss}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            <span>{closeLabel}</span>
          </Button>
        ) : null}
      </header>
      <div
        className={`flex flex-col gap-4 px-5 py-5 ${scrollableBody ? "min-h-0 flex-1 overflow-y-auto" : ""}`}
      >
        {children}
      </div>
    </dialog>
  );
}
