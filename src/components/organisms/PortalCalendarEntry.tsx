"use client";

import Link from "next/link";
import type { PortalCalendarEvent, PortalCalendarTeacherOption } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";
import { PortalCalendarSyncBlock } from "@/components/organisms/PortalCalendarSyncBlock";
import { PortalCalendarAgendaBoard } from "@/components/organisms/PortalCalendarAgendaBoard";
import { PortalCalendarAdminFilters } from "@/components/organisms/PortalCalendarAdminFilters";
import { PortalCalendarSpecialLegend } from "@/components/molecules/PortalCalendarSpecialLegend";

type PortalCalDict = Dictionary["dashboard"]["portalCalendar"];

export interface PortalCalendarEntryProps {
  locale: string;
  dict: PortalCalDict;
  /** Optional intro (e.g. admin master calendar). */
  lead?: string | null;
  events: PortalCalendarEvent[];
  feedUrl: string | null;
  admin?: {
    teachers: PortalCalendarTeacherOption[];
    rooms: string[];
    teacherId: string;
    room: string;
  };
  /** Admin-only: manage institute special calendar rows. */
  adminSpecialEventsHref?: string | null;
}

function CalendarBody({
  locale,
  dict,
  events,
  narrowAgenda,
}: {
  locale: string;
  dict: PortalCalDict;
  events: PortalCalendarEvent[];
  narrowAgenda: boolean;
}) {
  return (
    <div className="space-y-6">
      <PortalCalendarAgendaBoard
        locale={locale}
        events={events}
        dict={{
          pickDay: dict.agenda.pickDay,
          emptyDay: dict.agenda.emptyDay,
          agendaTitle: dict.agenda.agendaTitle,
          kindClass: dict.legend.class,
          kindExam: dict.legend.exam,
          kindSpecial: dict.legend.special,
          allDay: dict.agenda.allDay,
          specialTypes: dict.specialTypes,
        }}
        narrowAgenda={narrowAgenda}
      />
    </div>
  );
}

export function PortalCalendarEntry({
  locale,
  dict,
  lead,
  events,
  feedUrl,
  admin,
  adminSpecialEventsHref,
}: PortalCalendarEntryProps) {
  const legend = (
    <div className="space-y-3 text-xs text-[var(--color-muted-foreground)]">
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded-sm bg-[var(--color-primary)]/40" aria-hidden />
          {dict.legend.class}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded-sm bg-[var(--color-error)]/50" aria-hidden />
          {dict.legend.exam}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded-sm bg-[var(--color-accent)]/60" aria-hidden />
          {dict.legend.special}
        </span>
      </div>
      <PortalCalendarSpecialLegend title={dict.specialLegendTitle} types={dict.specialTypes} />
    </div>
  );

  const innerDesktop = (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{dict.title}</h1>
      {lead ? <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p> : null}
      {legend}
      {admin ? (
        <PortalCalendarAdminFilters
          locale={locale}
          teachers={admin.teachers}
          rooms={admin.rooms}
          teacherId={admin.teacherId}
          room={admin.room}
          dict={dict.adminFilters}
        />
      ) : null}
      {admin && adminSpecialEventsHref ? (
        <p className="text-sm">
          <Link
            href={adminSpecialEventsHref}
            className="font-medium text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary)]/90"
          >
            {dict.adminManageSpecials}
          </Link>
        </p>
      ) : null}
      <PortalCalendarSyncBlock dict={dict.sync} initialFeedUrl={feedUrl} />
      <CalendarBody locale={locale} dict={dict} events={events} narrowAgenda={false} />
    </div>
  );

  const innerNarrow = (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold text-[var(--color-secondary)]">{dict.title}</h1>
      {lead ? <p className="text-xs text-[var(--color-muted-foreground)]">{lead}</p> : null}
      {legend}
      {admin ? (
        <PortalCalendarAdminFilters
          locale={locale}
          teachers={admin.teachers}
          rooms={admin.rooms}
          teacherId={admin.teacherId}
          room={admin.room}
          dict={dict.adminFilters}
        />
      ) : null}
      {admin && adminSpecialEventsHref ? (
        <p className="text-sm">
          <Link
            href={adminSpecialEventsHref}
            className="font-medium text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary)]/90"
          >
            {dict.adminManageSpecials}
          </Link>
        </p>
      ) : null}
      <PortalCalendarSyncBlock dict={dict.sync} initialFeedUrl={feedUrl} />
      <CalendarBody locale={locale} dict={dict} events={events} narrowAgenda />
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={<div className="animate-pulse h-40 rounded bg-[var(--color-muted)]" aria-hidden />}
      desktop={<div>{innerDesktop}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">{innerNarrow}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
