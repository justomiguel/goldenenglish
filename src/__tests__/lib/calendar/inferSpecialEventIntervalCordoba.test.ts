import { describe, expect, it } from "vitest";
import { inferSpecialEventIntervalCordoba } from "@/lib/calendar/inferSpecialEventIntervalCordoba";

describe("inferSpecialEventIntervalCordoba", () => {
  it("returns one-day span for all-day", () => {
    const r = inferSpecialEventIntervalCordoba({ eventDate: "2025-08-10", allDay: true });
    expect(r).not.toBeNull();
    expect(new Date(r!.starts_at).getTime()).toBeLessThan(new Date(r!.ends_at).getTime());
  });

  it("rejects end before start for timed", () => {
    const r = inferSpecialEventIntervalCordoba({
      eventDate: "2025-08-10",
      allDay: false,
      startTime: "11:00",
      endTime: "09:00",
    });
    expect(r).toBeNull();
  });
});
