"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";

export interface AcademicSectionHealthChartShellProps {
  title: string;
  empty: string;
  hasData: boolean;
  children: ReactNode;
  helpAriaLabel: string;
  onOpenHelp: () => void;
}

export function AcademicSectionHealthChartShell({
  title,
  empty,
  hasData,
  children,
  helpAriaLabel,
  onOpenHelp,
}: AcademicSectionHealthChartShellProps) {
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 pr-1 text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
        <button
          type="button"
          onClick={onOpenHelp}
          aria-label={helpAriaLabel}
          className="inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-[var(--layout-border-radius)] border border-transparent text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/40 hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
      {hasData ? <div className="mt-3 h-48 w-full">{children}</div> : <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{empty}</p>}
    </section>
  );
}
