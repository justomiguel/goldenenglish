import { describe, it, expect } from "vitest";
import {
  sectionAttendanceCyclePresentPct,
  sectionAttendanceMonthPresentPct,
} from "@/lib/academics/sectionAttendanceMonthPct";

describe("sectionAttendanceCyclePresentPct", () => {
  it("returns null for empty rows", () => {
    expect(sectionAttendanceCyclePresentPct([])).toBeNull();
  });

  it("matches monthly ratio semantics over all rows", () => {
    const rows = [
      { attended_on: "2026-01-10", status: "present" },
      { attended_on: "2026-02-05", status: "absent" },
    ];
    expect(sectionAttendanceCyclePresentPct(rows)).toBe(50);
    expect(sectionAttendanceMonthPresentPct(rows, 2026, 1)).toBe(100);
    expect(sectionAttendanceMonthPresentPct(rows, 2026, 2)).toBe(0);
  });
});
