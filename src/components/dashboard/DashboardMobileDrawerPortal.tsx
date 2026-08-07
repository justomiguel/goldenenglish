"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export interface DashboardMobileDrawerPortalProps {
  open: boolean;
  onClose: () => void;
  dialogLabel: string;
  children: ReactNode;
}

/**
 * Full-viewport mobile nav overlay mounted on `document.body` so it escapes
 * sticky/backdrop-filter stacking contexts on chrome headers.
 */
export function DashboardMobileDrawerPortal({
  open,
  onClose,
  dialogLabel,
  children,
}: DashboardMobileDrawerPortalProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-0 z-[101] overflow-y-auto bg-[var(--color-muted)] animate-in fade-in duration-200"
        role="dialog"
        aria-label={dialogLabel}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
