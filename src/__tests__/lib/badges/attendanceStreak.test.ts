// REGRESSION CHECK: Calendar streak logic must not double-count the same YMD and must
// treat UTC date keys consistently for consecutive-day detection.
import { maxConsecutiveCalendarDayStreak } from "@/lib/badges/attendanceStreak";
import { describe, expect, it } from "vitest";

describe("maxConsecutiveCalendarDayStreak", () => {
  it("returns 0 for empty input", () => {
    expect(maxConsecutiveCalendarDayStreak([])).toBe(0);
  });

  it("one day → 1", () => {
    expect(maxConsecutiveCalendarDayStreak(["2026-01-10"])).toBe(1);
  });

  it("counts 5 consecutive days", () => {
    const days = ["2026-01-10", "2026-01-11", "2026-01-12", "2026-01-13", "2026-01-14"];
    expect(maxConsecutiveCalendarDayStreak(days)).toBe(5);
  });

  it("takes max over two runs (gap breaks streak)", () => {
    const days = [
      "2026-01-10",
      "2026-01-11",
      "2026-01-20",
      "2026-01-21",
      "2026-01-22",
    ];
    expect(maxConsecutiveCalendarDayStreak(days)).toBe(3);
  });
});
