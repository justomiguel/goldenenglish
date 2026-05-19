"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { EventClickArg } from "@fullcalendar/core";
import { addCalendarDaysToIsoDate } from "@/lib/calendar/civilGregorianDate";
import {
  buildPortalCalendarAgendaWeekGroups,
  formatPortalCalendarAgendaWeekTitle,
  instituteWeekStartIsoFromAnchor,
} from "@/lib/calendar/groupPortalCalendarAgendaWeek";
import {
  buildPortalCalendarFcEventInputs,
  portalCalendarFcExtendedPropsFromEvent,
  type PortalCalendarFcExtendedProps,
} from "@/lib/calendar/portalEventsToFullCalendar";
import {
  PortalCalendarNarrowAgendaHeader,
  type PortalCalendarNarrowAgendaView,
} from "@/components/pwa/molecules/PortalCalendarNarrowAgendaHeader";
import { PortalCalendarNarrowAgendaList } from "@/components/pwa/molecules/PortalCalendarNarrowAgendaList";
import { PortalCalendarNarrowAgendaMonth } from "@/components/pwa/molecules/PortalCalendarNarrowAgendaMonth";
import { PortalCalendarEventDetailModal } from "@/components/organisms/PortalCalendarEventDetailModal";
import type { PortalCalendarScheduleBoardDict } from "@/components/organisms/PortalCalendarScheduleBoard";
import type { PortalCalendarEvent } from "@/types/portalCalendar";

type DetailState = {
  title: string;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  extendedProps: PortalCalendarFcExtendedProps;
};

export interface PortalCalendarNarrowAgendaProps {
  locale: string;
  events: PortalCalendarEvent[];
  dict: PortalCalendarScheduleBoardDict;
  viewerId?: string;
  highlightTeacherId?: string;
}

export function PortalCalendarNarrowAgenda({
  locale,
  events,
  dict,
  viewerId,
  highlightTeacherId,
}: PortalCalendarNarrowAgendaProps) {
  const titleId = useId();
  const [view, setView] = useState<PortalCalendarNarrowAgendaView>("list");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [weekStartIso, setWeekStartIso] = useState(() => instituteWeekStartIsoFromAnchor(new Date()));
  const [detail, setDetail] = useState<DetailState | null>(null);

  const now = useMemo(() => new Date(nowTick), [nowTick]);
  const visualCtx = useMemo(
    () => ({
      viewerId,
      highlightTeacherId: highlightTeacherId?.trim() || undefined,
    }),
    [highlightTeacherId, viewerId],
  );
  const fcCtx = useMemo(() => ({ now, ...visualCtx }), [now, visualCtx]);

  const weekGroups = useMemo(
    () => buildPortalCalendarAgendaWeekGroups(events, weekStartIso, locale, now),
    [events, locale, now, weekStartIso],
  );
  const weekTitle = useMemo(
    () => formatPortalCalendarAgendaWeekTitle(weekStartIso, locale),
    [locale, weekStartIso],
  );
  const hasWeekEvents = weekGroups.some((g) => g.events.length > 0);

  const contentDict = useMemo(
    () => ({
      allDay: dict.schedule.allDay,
      legend: dict.legend,
      specialTypes: dict.specialTypes,
    }),
    [dict.legend, dict.specialTypes, dict.schedule.allDay],
  );

  const detailDict = useMemo(
    () => ({
      ...dict.schedule,
      legend: dict.legend,
      specialTypes: dict.specialTypes,
    }),
    [dict],
  );

  const fcEvents = useMemo(() => buildPortalCalendarFcEventInputs(events, fcCtx), [events, fcCtx]);

  const openEvent = useCallback(
    (ev: PortalCalendarEvent) => {
      setDetail({
        title: ev.title,
        start: ev.start ? new Date(ev.start) : null,
        end: ev.end ? new Date(ev.end) : null,
        allDay: Boolean(ev.allDay),
        extendedProps: portalCalendarFcExtendedPropsFromEvent(ev, fcCtx),
      });
    },
    [fcCtx],
  );

  const eventClick = useCallback((info: EventClickArg) => {
    info.jsEvent.preventDefault();
    const xp = info.event.extendedProps as PortalCalendarFcExtendedProps;
    setDetail({
      title: info.event.title || "",
      start: info.event.start,
      end: info.event.end,
      allDay: info.event.allDay,
      extendedProps: xp,
    });
  }, []);

  const shiftWeek = (delta: number) => {
    const next = addCalendarDaysToIsoDate(weekStartIso, delta * 7);
    if (next) setWeekStartIso(next);
  };

  const goToday = () => {
    setNowTick(Date.now());
    setWeekStartIso(instituteWeekStartIsoFromAnchor(new Date()));
  };

  return (
    <div className="portal-calendar portal-calendar--narrow flex min-h-0 flex-col">
      <PortalCalendarNarrowAgendaHeader
        weekTitle={weekTitle}
        dict={dict.schedule}
        view={view}
        onViewChange={setView}
        onPrevWeek={() => shiftWeek(-1)}
        onNextWeek={() => shiftWeek(1)}
        onToday={goToday}
      />

      {view === "list" ? (
        <PortalCalendarNarrowAgendaList
          groups={weekGroups}
          locale={locale}
          now={now}
          visualCtx={visualCtx}
          contentDict={contentDict}
          todayLabel={dict.schedule.today}
          emptyLabel={dict.schedule.noEvents}
          hasWeekEvents={hasWeekEvents}
          onSelect={openEvent}
        />
      ) : (
        <PortalCalendarNarrowAgendaMonth
          locale={locale}
          events={fcEvents}
          todayLabel={dict.schedule.today}
          moreEventsLabel={dict.schedule.moreEvents}
          noEventsLabel={dict.schedule.noEvents}
          onEventClick={eventClick}
          onDatesSet={() => setNowTick(Date.now())}
        />
      )}

      {detail ? (
        <PortalCalendarEventDetailModal
          open
          onOpenChange={(o) => {
            if (!o) setDetail(null);
          }}
          titleId={titleId}
          title={detail.title}
          start={detail.start}
          end={detail.end}
          allDay={detail.allDay}
          extendedProps={detail.extendedProps}
          locale={locale}
          dict={detailDict}
        />
      ) : null}
    </div>
  );
}
