"use client";

import FullCalendar from "@fullcalendar/react";
import luxon3Plugin from "@fullcalendar/luxon3";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import enGbLocale from "@fullcalendar/core/locales/en-gb";
import { INSTITUTE_CALENDAR_TIMEZONE } from "@/lib/birthdays/instituteCalendarTz";
import "@/components/organisms/portalCalendarFullCalendar.css";

export interface PortalCalendarNarrowAgendaMonthProps {
  locale: string;
  events: EventInput[];
  todayLabel: string;
  moreEventsLabel: string;
  noEventsLabel: string;
  onEventClick: (info: EventClickArg) => void;
  onDatesSet: () => void;
}

function fcLocaleForApp(locale: string) {
  if (locale === "es") return esLocale;
  if (locale.startsWith("en")) return enGbLocale;
  return undefined;
}

export function PortalCalendarNarrowAgendaMonth({
  locale,
  events,
  todayLabel,
  moreEventsLabel,
  noEventsLabel,
  onEventClick,
  onDatesSet,
}: PortalCalendarNarrowAgendaMonthProps) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <FullCalendar
        plugins={[luxon3Plugin, dayGridPlugin, interactionPlugin]}
        timeZone={INSTITUTE_CALENDAR_TIMEZONE}
        locale={fcLocaleForApp(locale)}
        initialView="dayGridMonth"
        headerToolbar={{ left: "prev,next", center: "title", right: "today" }}
        buttonText={{ today: todayLabel }}
        height="auto"
        aspectRatio={1.05}
        weekends
        editable={false}
        selectable={false}
        dayMaxEvents={2}
        moreLinkText={moreEventsLabel}
        noEventsText={noEventsLabel}
        events={events}
        eventClick={onEventClick}
        datesSet={onDatesSet}
      />
    </div>
  );
}
