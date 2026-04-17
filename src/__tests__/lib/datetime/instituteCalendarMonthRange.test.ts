import { describe, it, expect } from "vitest";
import {
  instituteCalendarPartsInTimeZone,
  instituteMonthYmdRangeInTimeZone,
} from "@/lib/datetime/instituteCalendarMonthRange";

describe("instituteCalendarMonthRange", () => {
  it("returns April 2026 bounds in UTC", () => {
    const now = new Date(Date.UTC(2026, 3, 16, 15, 0, 0));
    const { start, end } = instituteMonthYmdRangeInTimeZone(now, "UTC");
    expect(start).toBe("2026-04-01");
    expect(end).toBe("2026-04-30");
    const parts = instituteCalendarPartsInTimeZone(now, "UTC");
    expect(parts.y).toBe(2026);
    expect(parts.m).toBe(4);
  });
});
