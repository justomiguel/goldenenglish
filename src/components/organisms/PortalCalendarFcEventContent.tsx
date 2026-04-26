"use client";

import { MapPin, Video } from "lucide-react";
import type { EventContentArg } from "@fullcalendar/core";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import type { PortalCalendarFcExtendedProps } from "@/lib/calendar/portalEventsToFullCalendar";
import { portalCalendarKindLabel } from "@/lib/calendar/portalCalendarKindLabel";

export type PortalCalendarFcEventContentDict = {
  allDay: string;
  legend: Dictionary["dashboard"]["portalCalendar"]["legend"];
  specialTypes: Dictionary["dashboard"]["portalCalendar"]["specialTypes"];
};

function stubEvent(arg: EventContentArg): PortalCalendarEvent {
  const xp = arg.event.extendedProps as PortalCalendarFcExtendedProps;
  return {
    id: String(arg.event.id),
    kind: xp.kind,
    title: arg.event.title || "",
    start: arg.event.startStr,
    end: arg.event.endStr,
    allDay: arg.event.allDay,
    specialEventType: xp.specialEventType,
    meetingUrl: xp.meetingUrl,
    roomLabel: xp.roomLabel,
  };
}

function specialLegend(
  ev: PortalCalendarEvent,
  specialTypes: PortalCalendarFcEventContentDict["specialTypes"],
): string | undefined {
  if (ev.kind === "special" && ev.specialEventType) return specialTypes[ev.specialEventType].legend;
  return undefined;
}

export type PortalCalendarFcViewUi = "month" | "time" | "list";

export interface PortalCalendarFcEventContentProps {
  arg: EventContentArg;
  dict: PortalCalendarFcEventContentDict;
  locale: string;
  /** From `datesSet` / `viewDidMount`: controls extra subtitle lines in week/day. */
  viewUi: PortalCalendarFcViewUi;
}

export function PortalCalendarFcEventContent({ arg, dict, locale, viewUi }: PortalCalendarFcEventContentProps) {
  const ev = stubEvent(arg);
  const xp = arg.event.extendedProps as PortalCalendarFcExtendedProps;
  const kind = portalCalendarKindLabel(ev.kind, ev.specialEventType, dict.legend, dict.specialTypes);
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const timeShort =
    arg.event.allDay || !arg.event.start
      ? dict.allDay
      : arg.timeText || (arg.event.start ? timeFmt.format(arg.event.start) : dict.allDay);

  const compact = viewUi === "month" || viewUi === "list";
  const Icon = xp.isVirtual ? Video : MapPin;
  const subtitle = ev.roomLabel?.trim() || "—";

  return (
    <div
      className="fc-event-main-frame max-w-full overflow-hidden text-left text-[inherit]"
      title={specialLegend(ev, dict.specialTypes)}
    >
      {compact ? (
        <div className="flex min-w-0 items-center gap-1 px-0.5 py-0.5 text-[0.7rem] leading-tight">
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-[var(--color-foreground)] opacity-[0.72]"
            strokeWidth={2.25}
            aria-hidden
          />
          {!arg.event.allDay ? (
            <span className="shrink-0 font-mono text-[0.65rem] opacity-90">{timeShort}</span>
          ) : null}
          <span className="min-w-0 truncate font-medium">{arg.event.title}</span>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-0.5 px-1 py-0.5 text-[0.72rem] leading-snug">
          <div className="flex min-w-0 items-start gap-1">
            <Icon
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-foreground)] opacity-[0.72]"
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                {!arg.event.allDay ? (
                  <span className="font-mono text-[0.65rem] opacity-90">{timeShort}</span>
                ) : (
                  <span className="text-[0.65rem] opacity-90">{dict.allDay}</span>
                )}
                <span className="min-w-0 font-semibold leading-snug">{arg.event.title}</span>
              </div>
              <p className="mt-0.5 truncate text-[0.65rem] opacity-90">{subtitle}</p>
              <p className="truncate text-[0.62rem] opacity-75">({kind})</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
