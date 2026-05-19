"use client";

import type { ReactNode } from "react";

export interface MonthlyPaymentsPwaNestedDetailProps {
  /** Visible heading for the nested region (e.g. month + year or Enrollment). */
  title: string;
  children: ReactNode;
}

/** Indented child panel under the month/enrollment chips in PWA payments. */
export function MonthlyPaymentsPwaNestedDetail({
  title,
  children,
}: MonthlyPaymentsPwaNestedDetailProps) {
  return (
    <div
      className="relative mt-3 ml-1 rounded-r-[var(--layout-border-radius)] border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-muted)]/30 py-3 pl-4 pr-3 shadow-sm"
      role="region"
      aria-label={title}
    >
      <div
        className="pointer-events-none absolute -top-2 left-3 h-2 w-2 rotate-45 border border-[var(--color-border)] border-b-0 border-r-0 bg-[var(--color-muted)]/30"
        aria-hidden
      />
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
        {title}
      </p>
      {children}
    </div>
  );
}
