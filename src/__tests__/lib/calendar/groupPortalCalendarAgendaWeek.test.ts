// REGRESSION CHECK: Week grouping must respect institute civil days and all-day exclusive end dates.
import { describe, expect, it } from "vitest";
import {
  buildPortalCalendarAgendaWeekGroups,
  portalCalendarEventOnInstituteDay,
} from "@/lib/calendar/groupPortalCalendarAgendaWeek";
import type { PortalCalendarEvent } from "@/types/portalCalendar";

describe("portalCalendarEventOnInstituteDay", () => {
  it("includes all-day events on inclusive last civil day", () => {
    const ev: PortalCalendarEvent = {
      id: "a",
      kind: "special",
      title: "Holiday",
      start: "2026-05-01",
      end: "2026-05-02",
      allDay: true,
    };
    expect(portalCalendarEventOnInstituteDay(ev, "2026-05-01")).toBe(true);
    expect(portalCalendarEventOnInstituteDay(ev, "2026-05-02")).toBe(false);
  });
});

describe("buildPortalCalendarAgendaWeekGroups", () => {
  it("sorts timed events within a day by start", () => {
    const events: PortalCalendarEvent[] = [
      {
        id: "late",
        kind: "class",
        title: "Late",
        start: "2026-04-07T15:00:00.000Z",
        end: "2026-04-07T16:00:00.000Z",
      },
      {
        id: "early",
        kind: "class",
        title: "Early",
        start: "2026-04-07T10:00:00.000Z",
        end: "2026-04-07T11:00:00.000Z",
      },
    ];
    const groups = buildPortalCalendarAgendaWeekGroups(
      events,
      "2026-04-06",
      "en",
      new Date("2026-04-07T12:00:00.000Z"),
    );
    const tuesday = groups.find((g) => g.dayIso === "2026-04-07");
    expect(tuesday?.events.map((e) => e.id)).toEqual(["early", "late"]);
  });
});
