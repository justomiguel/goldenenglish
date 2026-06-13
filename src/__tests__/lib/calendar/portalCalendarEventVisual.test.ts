import {
  portalCalendarEventFcClassNames,
  portalCalendarEventIsVirtual,
  portalCalendarEventTiming,
} from "@/lib/calendar/portalCalendarEventVisual";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import { DateTime } from "luxon";
import { INSTITUTE_CALENDAR_TIMEZONE } from "@/lib/birthdays/instituteCalendarTz";

describe("portalCalendarEventVisual", () => {
  /** Institute civil 2026-04-10 afternoon — stable vs FullCalendar `timeZone`. */
  const now = DateTime.fromObject(
    { year: 2026, month: 4, day: 10, hour: 15 },
    { zone: INSTITUTE_CALENDAR_TIMEZONE },
  ).toJSDate();

  it("classifies past when end before now", () => {
    const ev: PortalCalendarEvent = {
      id: "1",
      kind: "class",
      title: "Old",
      start: "2026-04-01T10:00:00.000Z",
      end: "2026-04-01T11:00:00.000Z",
    };
    expect(portalCalendarEventTiming(ev, now)).toBe("past");
  });

  it("classifies all-day date-only events using institute civil YYYY-MM-DD (exclusive end)", () => {
    const ev: PortalCalendarEvent = {
      id: "all-day",
      kind: "special",
      title: "Holiday",
      start: "2026-04-10",
      end: "2026-04-11",
      allDay: true,
    };
    expect(portalCalendarEventTiming(ev, now)).toBe("today");
  });

  it("detects https meeting as virtual", () => {
    expect(portalCalendarEventIsVirtual({ meetingUrl: "https://x.test" })).toBe(true);
    expect(portalCalendarEventIsVirtual({ meetingUrl: "http://x.test" })).toBe(false);
    expect(portalCalendarEventIsVirtual({ meetingUrl: null })).toBe(false);
  });

  it("adds own highlight when viewer matches teacherId", () => {
    const ev: PortalCalendarEvent = {
      id: "2",
      kind: "class",
      title: "Mine",
      start: "2026-04-20T10:00:00.000Z",
      end: "2026-04-20T11:00:00.000Z",
      teacherId: "u99",
    };
    const classes = portalCalendarEventFcClassNames(ev, now, { viewerId: "u99" });
    expect(classes).toContain("portal-cal-ev--own");
  });

  it("styles birthday events with dedicated chip class", () => {
    const ev: PortalCalendarEvent = {
      id: "b1",
      kind: "birthday",
      title: "Birthday",
      start: "2026-04-15",
      end: "2026-04-16",
      allDay: true,
    };
    const classes = portalCalendarEventFcClassNames(ev, now, {});
    expect(classes).toContain("portal-cal-ev--birthday");
  });

  it("styles institute events with dedicated chip class", () => {
    const ev: PortalCalendarEvent = {
      id: "ie1",
      kind: "institute_event",
      title: "Concert",
      start: "2026-06-01T18:00:00.000Z",
      end: "2026-06-01T20:00:00.000Z",
      publicHref: "/es/events/concierto",
    };
    const classes = portalCalendarEventFcClassNames(ev, now, {});
    expect(classes).toContain("portal-cal-ev--institute-event");
  });
});
