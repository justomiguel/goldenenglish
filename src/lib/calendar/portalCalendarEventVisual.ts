import type { PortalCalendarEvent } from "@/types/portalCalendar";
import { addCalendarDaysToIsoDate } from "@/lib/calendar/civilGregorianDate";
import {
  instituteCivilIsoDateFromInstant,
  instituteZonedDayBoundsMs,
} from "@/lib/birthdays/instituteCalendarTz";

export type PortalCalendarEventTiming = "past" | "today" | "upcoming";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Past / institute-"today" / upcoming for chips — matches FullCalendar when it uses
 * `timeZone: America/Argentina/Cordoba` (institute wall calendar).
 */
export function portalCalendarEventTiming(
  ev: Pick<PortalCalendarEvent, "start" | "end" | "allDay">,
  now: Date,
): PortalCalendarEventTiming {
  if (
    ev.allDay &&
    ISO_DATE_ONLY.test(ev.start.trim()) &&
    ISO_DATE_ONLY.test(ev.end.trim())
  ) {
    const startYmd = ev.start.trim();
    const endExclusiveYmd = ev.end.trim();
    const lastInclusive = addCalendarDaysToIsoDate(endExclusiveYmd, -1);
    if (lastInclusive) {
      const todayInstitute = instituteCivilIsoDateFromInstant(now);
      if (lastInclusive < todayInstitute) return "past";
      if (startYmd <= todayInstitute && todayInstitute <= lastInclusive) return "today";
      return "upcoming";
    }
  }

  const start = new Date(ev.start);
  const end = new Date(ev.end);
  if (end.getTime() < now.getTime()) return "past";

  const { dayStartMs, dayEndMs } = instituteZonedDayBoundsMs(now);
  if (start.getTime() <= dayEndMs && end.getTime() >= dayStartMs) return "today";

  return "upcoming";
}

export function portalCalendarEventIsVirtual(ev: Pick<PortalCalendarEvent, "meetingUrl">): boolean {
  const u = ev.meetingUrl;
  if (u == null || typeof u !== "string") return false;
  return /^https:\/\//i.test(u.trim());
}

export type PortalCalendarEventVisualContext = {
  viewerId?: string;
  /** Admin calendar: URL `teacher` filter — highlights that teacher's rows. */
  highlightTeacherId?: string;
};

export function portalCalendarEventIsOwn(ev: PortalCalendarEvent, ctx: PortalCalendarEventVisualContext): boolean {
  if (!ev.teacherId) return false;
  if (ctx.viewerId && ev.teacherId === ctx.viewerId) return true;
  if (ctx.highlightTeacherId && ev.teacherId === ctx.highlightTeacherId) return true;
  return false;
}

/**
 * CSS class names for FullCalendar `classNames` (styled in `portalCalendarFullCalendar.css`).
 * Priority: past → exam → special → today band → upcoming virtual vs in-person; optional own-session ring.
 */
export function portalCalendarEventFcClassNames(
  ev: PortalCalendarEvent,
  now: Date,
  ctx: PortalCalendarEventVisualContext,
): string[] {
  const classes = ["portal-cal-ev"];
  const timing = portalCalendarEventTiming(ev, now);

  if (timing === "past") {
    classes.push("portal-cal-ev--past");
  } else if (ev.kind === "exam") {
    classes.push("portal-cal-ev--exam");
  } else if (ev.kind === "special") {
    classes.push("portal-cal-ev--special");
  } else if (ev.kind === "birthday") {
    classes.push("portal-cal-ev--birthday");
  } else if (ev.kind === "institute_event") {
    classes.push("portal-cal-ev--institute-event");
  } else if (timing === "today") {
    classes.push("portal-cal-ev--today");
  } else if (portalCalendarEventIsVirtual(ev)) {
    classes.push("portal-cal-ev--upcoming-virtual");
  } else {
    classes.push("portal-cal-ev--upcoming-inperson");
  }

  if (portalCalendarEventIsOwn(ev, ctx)) classes.push("portal-cal-ev--own");

  return classes;
}
