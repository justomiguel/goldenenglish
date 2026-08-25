"use client";

import type { ReactNode } from "react";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

export interface PortalCalendarPageLayoutProps {
  variant: "desktop" | "narrow";
  title: string;
  lead?: string | null;
  /** Reference buttons (legend, sync) shown above filters and calendar. */
  toolbar: ReactNode;
  adminFilters?: ReactNode;
  adminSpecialLink?: ReactNode;
  schedule: ReactNode;
  /** Tour anchors for the portal that owns this route; admin ones are the default. */
  tourAnchors?: { title?: string; schedule?: string };
}

export function PortalCalendarPageLayout({
  variant,
  title,
  lead,
  toolbar,
  adminFilters,
  adminSpecialLink,
  schedule,
  tourAnchors,
}: PortalCalendarPageLayoutProps) {
  const titleAnchor =
    tourAnchors?.title ?? (adminFilters ? ADMIN_TOUR_ANCHORS.calendarTitle : undefined);
  const scheduleAnchor =
    tourAnchors?.schedule ?? (adminFilters ? ADMIN_TOUR_ANCHORS.calendarSchedule : undefined);
  const isAdmin = Boolean(adminFilters);
  const outer = isAdmin
    ? "space-y-6"
    : variant === "desktop"
      ? "mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      : "space-y-5";
  const card =
    "rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]";
  const body = (
    <div className="space-y-6">
      <aside className="rounded-2xl bg-[var(--color-muted)]/30 p-3 sm:p-4">{toolbar}</aside>
      {adminFilters ? (
        <div data-tour={ADMIN_TOUR_ANCHORS.calendarFilters}>{adminFilters}</div>
      ) : null}
      {adminSpecialLink}
      <div
        data-tour={scheduleAnchor}
        className={
          variant === "narrow"
            ? "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-2"
            : "min-h-[min(28rem,70dvh)] min-w-0 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-2 sm:p-4"
        }
      >
        {schedule}
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <div className={outer}>
        <div data-tour={titleAnchor}>
          <AdminPageHeader title={title} lead={lead ?? undefined} iconId="calendar" />
        </div>
        <div className={`${card} p-5 sm:p-6`}>{body}</div>
      </div>
    );
  }

  return (
    <div className={outer}>
      <AdminPageHeader
        title={title}
        lead={lead ?? undefined}
        iconId="calendar"
        tourAnchor={titleAnchor}
      />
      <div className={`${card} mt-6 p-5 sm:p-8`}>{body}</div>
    </div>
  );
}
