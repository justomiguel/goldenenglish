import { DateTime } from "luxon";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import { addCalendarDaysToIsoDate } from "@/lib/calendar/civilGregorianDate";
import {
  INSTITUTE_CALENDAR_TIMEZONE,
  instituteCivilIsoDateFromInstant,
} from "@/lib/birthdays/instituteCalendarTz";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type PortalCalendarAgendaDayGroup = {
  dayIso: string;
  heading: string;
  isToday: boolean;
  events: PortalCalendarEvent[];
};

/** Monday-start civil week containing `anchor` in institute TZ. */
export function instituteWeekStartIsoFromAnchor(anchor: Date): string {
  const zoned = DateTime.fromJSDate(anchor, { zone: INSTITUTE_CALENDAR_TIMEZONE });
  const monday = zoned.minus({ days: zoned.weekday - 1 }).startOf("day");
  return monday.toISODate() ?? instituteCivilIsoDateFromInstant(anchor);
}

export function portalCalendarEventOnInstituteDay(ev: PortalCalendarEvent, dayIso: string): boolean {
  if (ev.allDay && ISO_DATE_ONLY.test(ev.start.trim()) && ISO_DATE_ONLY.test(ev.end.trim())) {
    const startYmd = ev.start.trim();
    const endExclusive = ev.end.trim();
    const lastInclusive = addCalendarDaysToIsoDate(endExclusive, -1);
    if (!lastInclusive) return startYmd === dayIso;
    return startYmd <= dayIso && dayIso <= lastInclusive;
  }

  const startYmd = instituteCivilIsoDateFromInstant(new Date(ev.start));
  const endYmd = instituteCivilIsoDateFromInstant(new Date(ev.end));
  return startYmd <= dayIso && dayIso <= endYmd;
}

function eventSortKey(ev: PortalCalendarEvent): number {
  if (ev.allDay) return 0;
  const t = new Date(ev.start).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatAgendaDayHeading(dayIso: string, locale: string, todayIso: string): string {
  const [y, m, d] = dayIso.split("-").map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const date = new Date(noonUtc);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: INSTITUTE_CALENDAR_TIMEZONE,
  }).format(date);
}

export function buildPortalCalendarAgendaWeekGroups(
  events: PortalCalendarEvent[],
  weekStartIso: string,
  locale: string,
  now: Date,
): PortalCalendarAgendaDayGroup[] {
  const todayIso = instituteCivilIsoDateFromInstant(now);
  const groups: PortalCalendarAgendaDayGroup[] = [];

  for (let i = 0; i < 7; i += 1) {
    const dayIso = addCalendarDaysToIsoDate(weekStartIso, i);
    if (!dayIso) continue;
    const dayEvents = events
      .filter((ev) => portalCalendarEventOnInstituteDay(ev, dayIso))
      .sort((a, b) => eventSortKey(a) - eventSortKey(b) || a.title.localeCompare(b.title));
    groups.push({
      dayIso,
      heading: formatAgendaDayHeading(dayIso, locale, todayIso),
      isToday: dayIso === todayIso,
      events: dayEvents,
    });
  }

  return groups;
}

export function formatPortalCalendarAgendaWeekTitle(
  weekStartIso: string,
  locale: string,
): string {
  const weekEndIso = addCalendarDaysToIsoDate(weekStartIso, 6);
  if (!weekEndIso) return weekStartIso;

  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: INSTITUTE_CALENDAR_TIMEZONE,
  });

  const startParts = weekStartIso.split("-").map(Number);
  const endParts = weekEndIso.split("-").map(Number);
  const startDate = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2], 12, 0, 0));
  const endDate = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 12, 0, 0));

  return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
}
