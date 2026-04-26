import type { PortalCalendarEvent } from "@/types/portalCalendar";

export type PortalCalendarEventTiming = "past" | "today" | "upcoming";

/** Compare using the viewer's local calendar day for "today" band. */
export function portalCalendarEventTiming(
  ev: Pick<PortalCalendarEvent, "start" | "end">,
  now: Date,
): PortalCalendarEventTiming {
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  if (end.getTime() < now.getTime()) return "past";

  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const dayStart = new Date(y, m, d, 0, 0, 0, 0).getTime();
  const dayEnd = new Date(y, m, d, 23, 59, 59, 999).getTime();
  if (start.getTime() <= dayEnd && end.getTime() >= dayStart) return "today";

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
