import { describe, it, expect } from "vitest";
import { expandedOccurrencesToPortalEvents } from "@/lib/calendar/portalCalendarEventCodec";
import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";

describe("expandedOccurrencesToPortalEvents", () => {
  it("uses date-only YYYY-MM-DD for all-day occurrences so FullCalendar maps civil days correctly", () => {
    const row: ExpandedPortalOccurrence = {
      kind: "birthday",
      title: "Birthday: X",
      startMs: Date.UTC(2026, 5, 12, 12, 0, 0, 0),
      endMs: Date.UTC(2026, 5, 13, 12, 0, 0, 0),
      allDay: true,
      icsUid: "uid",
    };
    const [out] = expandedOccurrencesToPortalEvents([row]);
    expect(out.start).toBe("2026-06-12");
    expect(out.end).toBe("2026-06-13");
    expect(out.allDay).toBe(true);
  });

  it("keeps ISO datetimes for timed occurrences", () => {
    const row: ExpandedPortalOccurrence = {
      kind: "class",
      title: "C",
      startMs: Date.UTC(2026, 6, 1, 14, 0, 0, 0),
      endMs: Date.UTC(2026, 6, 1, 15, 0, 0, 0),
      allDay: false,
      icsUid: "u2",
    };
    const [out] = expandedOccurrencesToPortalEvents([row]);
    expect(out.start).toContain("T");
    expect(out.end).toContain("T");
    expect(out.allDay).toBe(false);
  });
});
