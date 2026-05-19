import { describe, it, expect } from "vitest";
import {
  clampMinAttendancePercent,
  resolveSectionMinAttendancePercent,
  DEFAULT_MIN_ATTENDANCE_PERCENT,
} from "@/lib/academics/resolveSectionMinAttendancePercent";

describe("resolveSectionMinAttendancePercent", () => {
  it("inherits global default when section override is null", () => {
    expect(resolveSectionMinAttendancePercent(null, 80)).toBe(80);
    expect(resolveSectionMinAttendancePercent(undefined, DEFAULT_MIN_ATTENDANCE_PERCENT)).toBe(75);
  });

  it("uses section override when set", () => {
    expect(resolveSectionMinAttendancePercent(90, 75)).toBe(90);
  });

  it("clamps out-of-range values", () => {
    expect(clampMinAttendancePercent(150)).toBe(100);
    expect(clampMinAttendancePercent(-5)).toBe(0);
  });
});
