import {
  portalCalendarEventFcClassNames,
  portalCalendarEventIsVirtual,
  portalCalendarEventTiming,
} from "@/lib/calendar/portalCalendarEventVisual";
import type { PortalCalendarEvent } from "@/types/portalCalendar";

describe("portalCalendarEventVisual", () => {
  const now = new Date("2026-04-10T15:00:00.000Z");

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
});
