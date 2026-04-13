"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Modal } from "@/components/atoms/Modal";
import { useAppSurface } from "@/hooks/useAppSurface";

export interface TeacherSuggestionShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  title: string;
  disableClose?: boolean;
  children: ReactNode;
}

function isNarrowSurface(surface: ReturnType<typeof useAppSurface>) {
  return surface === "web-mobile" || surface === "pwa-mobile";
}

export function TeacherSuggestionShell({
  open,
  onOpenChange,
  titleId,
  title,
  disableClose,
  children,
}: TeacherSuggestionShellProps) {
  const surface = useAppSurface();
  const narrow = isNarrowSurface(surface);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !narrow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableClose) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, narrow, disableClose, onOpenChange]);

  if (!open) return null;

  if (!narrow) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        titleId={titleId}
        title={title}
        disableClose={disableClose}
        dialogClassName="max-w-lg"
      >
        {children}
      </Modal>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-primary)_38%,transparent)]"
        aria-label="Close"
        disabled={disableClose}
        onClick={() => {
          if (!disableClose) onOpenChange(false);
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[min(88dvh,32rem)] w-full overflow-y-auto rounded-t-[var(--layout-border-radius)] border border-[var(--color-border)] border-b-0 bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <header className="sticky top-0 z-[1] border-b border-[var(--color-border)] bg-[var(--color-muted)]/35 px-4 py-3">
          <h2 id={titleId} className="font-display text-base font-semibold text-[var(--color-primary)]">
            {title}
          </h2>
        </header>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
