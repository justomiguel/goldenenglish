"use client";

import type { ReactNode } from "react";

export interface PortalCalendarPageLayoutProps {
  variant: "desktop" | "narrow";
  title: string;
  lead?: string | null;
  /** Reference buttons (legend, sync) shown above filters and calendar. */
  toolbar: ReactNode;
  adminFilters?: ReactNode;
  adminSpecialLink?: ReactNode;
  schedule: ReactNode;
}

export function PortalCalendarPageLayout({
  variant,
  title,
  lead,
  toolbar,
  adminFilters,
  adminSpecialLink,
  schedule,
}: PortalCalendarPageLayoutProps) {
  const outer = variant === "desktop" ? "mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" : "space-y-5";
  const card =
    "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]";
  const titleClass =
    variant === "desktop"
      ? "font-display text-2xl font-bold text-[var(--color-secondary)]"
      : "font-display text-xl font-bold text-[var(--color-secondary)]";

  return (
    <div className={outer}>
      <div className={`${card} p-5 sm:p-8`}>
        <header className="mb-6 space-y-2 border-b border-[var(--color-border)] pb-6">
          <h1 className={titleClass}>{title}</h1>
          {lead ? <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p> : null}
        </header>
        <div className="space-y-6">
          <aside className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/30 p-3 sm:p-4">{toolbar}</aside>
          {adminFilters}
          {adminSpecialLink}
          <div className="min-h-[min(28rem,70dvh)] min-w-0 overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 sm:p-4">
            {schedule}
          </div>
        </div>
      </div>
    </div>
  );
}
