import { describe, expect, it } from "vitest";
import { composePortalCalendarPageEvents } from "@/lib/calendar/composePortalCalendarPageEvents";

describe("composePortalCalendarPageEvents", () => {
  it("merges specials with classes", () => {
    const merged = composePortalCalendarPageEvents(
      [],
      [],
      [
        {
          id: "e1",
          title: "Holiday",
          notes: null,
          starts_at: "2025-06-01T12:00:00.000Z",
          ends_at: "2025-06-02T12:00:00.000Z",
          all_day: true,
          event_type: "holiday",
          calendar_scope: "global",
          cohort_id: null,
          section_id: null,
          meeting_url: null,
        },
      ],
      "2025-05-01",
      "2025-06-15",
    );
    expect(merged.some((x) => x.kind === "special")).toBe(true);
  });
});
