"use client";

import { portalCalendarKindLabel } from "@/lib/calendar/portalCalendarKindLabel";
import { portalCalendarEventDotClassName } from "@/lib/calendar/portalCalendarEventDotTone";
import type { PortalCalendarEventVisualContext } from "@/lib/calendar/portalCalendarEventVisual";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { PortalCalendarFcEventContentDict } from "@/components/organisms/PortalCalendarFcEventContent";
import { INSTITUTE_CALENDAR_TIMEZONE } from "@/lib/birthdays/instituteCalendarTz";

export interface PortalCalendarNarrowAgendaRowProps {
  ev: PortalCalendarEvent;
  locale: string;
  now: Date;
  visualCtx: PortalCalendarEventVisualContext;
  dict: PortalCalendarFcEventContentDict;
  onSelect: (ev: PortalCalendarEvent) => void;
}

function formatEventTime(
  ev: PortalCalendarEvent,
  locale: string,
  allDayLabel: string,
): string {
  if (ev.allDay) return allDayLabel;
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: INSTITUTE_CALENDAR_TIMEZONE,
  });
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  if (!Number.isFinite(start.getTime())) return allDayLabel;
  const startT = timeFmt.format(start);
  if (!Number.isFinite(end.getTime()) || end.getTime() <= start.getTime()) return startT;
  return `${startT}–${timeFmt.format(end)}`;
}

export function PortalCalendarNarrowAgendaRow({
  ev,
  locale,
  now,
  visualCtx,
  dict,
  onSelect,
}: PortalCalendarNarrowAgendaRowProps) {
  const timeLabel = formatEventTime(ev, locale, dict.allDay);
  const kind = portalCalendarKindLabel(ev.kind, ev.specialEventType, dict.legend, dict.specialTypes);
  const room = ev.kind === "birthday" ? null : ev.roomLabel?.trim() || null;
  const subtitle = room ?? kind;

  return (
    <li className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        type="button"
        className="flex min-h-[44px] w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--color-muted)]/40 active:bg-[var(--color-muted)]/60"
        onClick={() => onSelect(ev)}
      >
        <span
          className={portalCalendarEventDotClassName(ev, now, visualCtx)}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="shrink-0 font-mono text-xs text-[var(--color-muted-foreground)]">
              {timeLabel}
            </span>
            <span className="min-w-0 font-medium leading-snug text-[var(--color-foreground)]">
              {ev.title}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-[var(--color-muted-foreground)]">
            {subtitle}
          </span>
        </span>
      </button>
    </li>
  );
}
