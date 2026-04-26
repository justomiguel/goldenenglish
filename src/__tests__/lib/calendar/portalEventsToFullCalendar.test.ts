import { buildPortalCalendarFcEventInputs } from "@/lib/calendar/portalEventsToFullCalendar";
import type { PortalCalendarEvent } from "@/types/portalCalendar";

const NOW = new Date("2026-04-01T12:00:00.000Z");

describe("buildPortalCalendarFcEventInputs", () => {
  it("maps timed class event with timing and classNames", () => {
    const ev: PortalCalendarEvent = {
      id: "a",
      kind: "class",
      title: "English A1",
      start: "2026-04-01T14:00:00.000Z",
      end: "2026-04-01T15:30:00.000Z",
      roomLabel: "Room 2",
      teacherId: "t1",
    };
    const [out] = buildPortalCalendarFcEventInputs([ev], { now: NOW, viewerId: "t1" });
    expect(out.id).toBe("a");
    expect(out.title).toBe("English A1");
    expect(out.start).toBe(ev.start);
    expect(out.end).toBe(ev.end);
    expect(out.allDay).toBe(false);
    expect(out.classNames).toContain("portal-cal-ev--today");
    expect(out.classNames).toContain("portal-cal-ev--own");
    expect(out.extendedProps).toMatchObject({
      kind: "class",
      meetingUrl: null,
      roomLabel: "Room 2",
      timing: "today",
      isVirtual: false,
      isOwn: true,
    });
  });

  it("maps all-day special with meeting URL as virtual", () => {
    const ev: PortalCalendarEvent = {
      id: "b",
      kind: "special",
      title: "Parents meeting",
      start: "2026-05-10T00:00:00.000Z",
      end: "2026-05-10T23:59:59.999Z",
      allDay: true,
      specialEventType: "parent_meeting",
      meetingUrl: "https://example.com/meet",
      roomLabel: null,
    };
    const [out] = buildPortalCalendarFcEventInputs([ev], { now: NOW });
    expect(out.allDay).toBe(true);
    expect(out.classNames).toContain("portal-cal-ev--special");
    expect(out.extendedProps).toMatchObject({
      kind: "special",
      specialEventType: "parent_meeting",
      meetingUrl: "https://example.com/meet",
      roomLabel: null,
      isVirtual: true,
    });
  });

  it("treats missing allDay as false", () => {
    const ev: PortalCalendarEvent = {
      id: "c",
      kind: "exam",
      title: "Midterm",
      start: "2026-06-01T12:00:00.000Z",
      end: "2026-06-01T13:00:00.000Z",
    };
    const [out] = buildPortalCalendarFcEventInputs([ev], { now: NOW });
    expect(out.allDay).toBe(false);
    expect(out.classNames).toContain("portal-cal-ev--exam");
  });
});
