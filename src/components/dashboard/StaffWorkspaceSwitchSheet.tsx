"use client";

import { ChevronLeft, X } from "lucide-react";
import type { ReactNode, Ref } from "react";

export function StaffWorkspaceSwitchSheet({
  panelRef,
  title,
  titleId,
  closeLabel,
  backLabel,
  onBack,
  onClose,
  children,
}: {
  panelRef: Ref<HTMLDivElement>;
  title: string;
  titleId: string;
  closeLabel: string;
  backLabel: string | null;
  onBack: (() => void) | null;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div ref={panelRef} className="fixed inset-0 z-[200] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(85dvh,40rem)] w-full flex-col rounded-t-3xl bg-[var(--color-surface)] shadow-[var(--shadow-soft)]"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--color-border)]" />
        <div className="flex items-center gap-1 px-2 pb-1 pt-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-[var(--color-primary)]"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              {backLabel}
            </button>
          ) : (
            <h2
              id={titleId}
              className="min-w-0 flex-1 truncate px-2 text-base font-semibold text-[var(--color-foreground)]"
            >
              {title}
            </h2>
          )}
          {onBack ? (
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="ms-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">{children}</div>
      </div>
    </div>
  );
}
