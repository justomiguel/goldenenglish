"use client";

import { useCallback, useId, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import enGbLocale from "@fullcalendar/core/locales/en-gb";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import {
  buildPortalCalendarFcEventInputs,
  type PortalCalendarFcExtendedProps,
} from "@/lib/calendar/portalEventsToFullCalendar";
import {
  PortalCalendarFcEventContent,
  type PortalCalendarFcViewUi,
} from "@/components/organisms/PortalCalendarFcEventContent";
import { PortalCalendarEventDetailModal } from "@/components/organisms/PortalCalendarEventDetailModal";
import type { Dictionary } from "@/types/i18n";
import "./portalCalendarFullCalendar.css";

export type PortalCalendarScheduleBoardDict = {
  legend: Dictionary["dashboard"]["portalCalendar"]["legend"];
  specialTypes: Dictionary["dashboard"]["portalCalendar"]["specialTypes"];
  schedule: Dictionary["dashboard"]["portalCalendar"]["schedule"];
};

type DetailState = {
  title: string;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  extendedProps: PortalCalendarFcExtendedProps;
};

export interface PortalCalendarScheduleBoardProps {
  locale: string;
  events: PortalCalendarEvent[];
  narrowAgenda: boolean;
  dict: PortalCalendarScheduleBoardDict;
  /** Logged-in user — used to highlight “own” section rows when `teacherId` matches. */
  viewerId?: string;
  /** Admin calendar: matches URL `teacher` filter to `event.teacherId`. */
  highlightTeacherId?: string;
}

function fcLocaleForApp(locale: string) {
  if (locale === "es") return esLocale;
  if (locale.startsWith("en")) return enGbLocale;
  return undefined;
}

function viewUiFromFcType(viewType: string): PortalCalendarFcViewUi {
  if (viewType.startsWith("dayGrid")) return "month";
  if (viewType.startsWith("timeGrid")) return "time";
  if (viewType.startsWith("list")) return "list";
  return "month";
}

export function PortalCalendarScheduleBoard({
  locale,
  events,
  narrowAgenda,
  dict,
  viewerId,
  highlightTeacherId,
}: PortalCalendarScheduleBoardProps) {
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [viewUi, setViewUi] = useState<PortalCalendarFcViewUi>(() =>
    narrowAgenda ? "list" : "month",
  );
  const [detail, setDetail] = useState<DetailState | null>(null);
  const titleId = useId();

  const fcEvents = useMemo(() => {
    const now = new Date(nowTick);
    return buildPortalCalendarFcEventInputs(events, {
      now,
      viewerId,
      highlightTeacherId: highlightTeacherId?.trim() || undefined,
    });
  }, [events, highlightTeacherId, nowTick, viewerId]);

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

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setViewUi(viewUiFromFcType(arg.view.type));
    setNowTick(Date.now());
  }, []);

  const fcLocale = fcLocaleForApp(locale);

  const headerToolbar = narrowAgenda
    ? { left: "prev,next today", center: "title", right: "listWeek,dayGridMonth" }
    : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" };

  const initialView = narrowAgenda ? "listWeek" : "dayGridMonth";

  const buttonText = useMemo(
    () => ({
      today: dict.schedule.today,
      month: dict.schedule.viewsMonth,
      week: dict.schedule.viewsWeek,
      day: dict.schedule.viewsDay,
      list: dict.schedule.viewsList,
    }),
    [dict.schedule],
  );

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

  return (
    <div className="portal-calendar min-w-0">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        locale={fcLocale}
        initialView={initialView}
        headerToolbar={headerToolbar}
        buttonText={buttonText}
        height="auto"
        aspectRatio={1.8}
        weekends
        editable={false}
        selectable={false}
        dayMaxEvents={3}
        moreLinkText={dict.schedule.moreEvents}
        noEventsText={dict.schedule.noEvents}
        events={fcEvents}
        eventClick={eventClick}
        datesSet={onDatesSet}
        eventContent={(arg) => (
          <PortalCalendarFcEventContent arg={arg} dict={contentDict} locale={locale} viewUi={viewUi} />
        )}
        nowIndicator
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
      />
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
