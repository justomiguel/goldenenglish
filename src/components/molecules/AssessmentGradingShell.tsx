"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/atoms/Modal";

export interface AssessmentGradingShellProps {
  narrow: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  title: string;
  backdropCloseAria: string;
  children: ReactNode;
}

export function AssessmentGradingShell({
  narrow,
  open,
  onOpenChange,
  titleId,
  title,
  backdropCloseAria,
  children,
}: AssessmentGradingShellProps) {
  if (!narrow) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        titleId={titleId}
        title={title}
        dialogClassName="max-w-lg"
        stackClassName="z-[200]"
      >
        {children}
      </Modal>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[200] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        aria-label={backdropCloseAria}
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-x-0 bottom-0 flex max-h-[min(92dvh,44rem)] flex-col rounded-t-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-transform duration-200 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-muted)]/35 px-4 py-3">
          <h2 id={titleId} className="font-display text-lg font-semibold text-[var(--color-primary)]">
            {title}
          </h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
