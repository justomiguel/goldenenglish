"use client";

import { useEffect, useRef, type ReactNode } from "react";

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
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

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

  return (
    <dialog
      ref={ref}
      className="fixed left-1/2 top-1/2 z-[100] max-h-[min(90dvh,40rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-foreground)] shadow-[var(--shadow-card)] ring-2 ring-[var(--color-primary)]/10 open:flex open:flex-col [&::backdrop]:bg-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-label={ariaLabel}
      onClose={onDialogClose}
      onCancel={(e) => {
        if (disableClose) e.preventDefault();
      }}
    >
      <header className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/35 px-5 py-4">
        <h2
          id={titleId}
          className="font-display text-lg font-semibold text-[var(--color-primary)]"
        >
          {title}
        </h2>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {children}
      </div>
    </dialog>
  );
}
