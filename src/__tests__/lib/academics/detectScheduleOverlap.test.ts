import { describe, it, expect } from "vitest";
import { schedulesOverlap } from "@/lib/academics/detectScheduleOverlap";

describe("schedulesOverlap", () => {
  it("returns false for disjoint weekdays", () => {
    const a = [{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }];
    const b = [{ dayOfWeek: 2, startTime: "10:00", endTime: "11:00" }];
    expect(schedulesOverlap(a, b)).toBe(false);
  });

  it("returns true when same weekday and intervals overlap", () => {
    const a = [{ dayOfWeek: 3, startTime: "09:00", endTime: "10:30" }];
    const b = [{ dayOfWeek: 3, startTime: "10:00", endTime: "11:00" }];
    expect(schedulesOverlap(a, b)).toBe(true);
  });

  it("returns false when same weekday but adjacent without overlap", () => {
    const a = [{ dayOfWeek: 4, startTime: "09:00", endTime: "10:00" }];
    const b = [{ dayOfWeek: 4, startTime: "10:00", endTime: "11:00" }];
    expect(schedulesOverlap(a, b)).toBe(false);
  });
});
