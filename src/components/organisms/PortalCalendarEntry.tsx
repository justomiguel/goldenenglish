"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { PortalCalendarEvent, PortalCalendarTeacherOption } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";
import { PortalCalendarAssistPanel } from "@/components/organisms/PortalCalendarAssistPanel";
import { PortalCalendarAdminFilters } from "@/components/organisms/PortalCalendarAdminFilters";
import { PortalCalendarPageLayout } from "@/components/organisms/PortalCalendarPageLayout";
import { PortalCalendarScheduleBoard } from "@/components/organisms/PortalCalendarScheduleBoard";

type PortalCalDict = Dictionary["dashboard"]["portalCalendar"];

export interface PortalCalendarEntryProps {
  locale: string;
  dict: PortalCalDict;
  /** Optional intro (e.g. admin master calendar). */
  lead?: string | null;
  events: PortalCalendarEvent[];
  feedUrl: string | null;
  /** Current auth user — highlights calendar rows tied to this teacher id when present on events. */
  viewerId?: string;
  admin?: {
    teachers: PortalCalendarTeacherOption[];
    rooms: string[];
    teacherId: string;
    room: string;
  };
  /** Admin-only: manage institute special calendar rows. */
  adminSpecialEventsHref?: string | null;
}

export function PortalCalendarEntry({
  locale,
  dict,
  lead,
  events,
  feedUrl,
  viewerId,
  admin,
  adminSpecialEventsHref,
}: PortalCalendarEntryProps) {
  const toolbar = useMemo(
    () => <PortalCalendarAssistPanel dict={dict} feedUrl={feedUrl} />,
    [dict, feedUrl],
  );

  const scheduleDict = useMemo(
    () => ({
      legend: dict.legend,
      specialTypes: dict.specialTypes,
      schedule: dict.schedule,
    }),
    [dict.legend, dict.specialTypes, dict.schedule],
  );

  const highlightTeacherId = admin?.teacherId?.trim() || undefined;

  const adminFiltersEl = admin ? (
    <PortalCalendarAdminFilters
      locale={locale}
      teachers={admin.teachers}
      rooms={admin.rooms}
      teacherId={admin.teacherId}
      room={admin.room}
      dict={dict.adminFilters}
    />
  ) : null;

  const adminLinkEl =
    admin && adminSpecialEventsHref ? (
      <p className="text-sm">
        <Link
          href={adminSpecialEventsHref}
          className="font-medium text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary)]/90"
        >
          {dict.adminManageSpecials}
        </Link>
      </p>
    ) : null;

  const desktopBody = (
    <PortalCalendarPageLayout
      variant="desktop"
      title={dict.title}
      lead={lead}
      toolbar={toolbar}
      adminFilters={adminFiltersEl}
      adminSpecialLink={adminLinkEl}
      schedule={
        <PortalCalendarScheduleBoard
          locale={locale}
          events={events}
          narrowAgenda={false}
          dict={scheduleDict}
          viewerId={viewerId}
          highlightTeacherId={highlightTeacherId}
        />
      }
    />
  );

  const narrowBody = (
    <PortalCalendarPageLayout
      variant="narrow"
      title={dict.title}
      lead={lead}
      toolbar={toolbar}
      adminFilters={adminFiltersEl}
      adminSpecialLink={adminLinkEl}
      schedule={
        <PortalCalendarScheduleBoard
          locale={locale}
          events={events}
          narrowAgenda
          dict={scheduleDict}
          viewerId={viewerId}
          highlightTeacherId={highlightTeacherId}
        />
      }
    />
  );

  return (
    <SurfaceMountGate
      skeleton={<div className="h-40 animate-pulse rounded bg-[var(--color-muted)]" aria-hidden />}
      desktop={<div>{desktopBody}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">{narrowBody}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
