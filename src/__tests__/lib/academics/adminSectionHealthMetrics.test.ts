import { describe, expect, it } from "vitest";
import {
  computeAssessmentCoveragePct,
  computeAttendanceRatePct,
  computeCapacityUtilizationPct,
} from "@/lib/academics/adminSectionHealthMetrics";

describe("adminSectionHealthMetrics", () => {
  it("computes attendance rate with excused in numerator", () => {
    expect(computeAttendanceRatePct(8, 1, 1, 2)).toBe(92);
  });

  it("returns null when no attendance rows", () => {
    expect(computeAttendanceRatePct(0, 0, 0, 0)).toBeNull();
  });

  it("computes capacity utilization capped at 100", () => {
    expect(computeCapacityUtilizationPct(10, 10)).toBe(100);
    expect(computeCapacityUtilizationPct(0, 20)).toBe(0);
  });

  it("returns null capacity when max is zero", () => {
    expect(computeCapacityUtilizationPct(3, 0)).toBeNull();
  });

  it("computes assessment coverage", () => {
    expect(computeAssessmentCoveragePct(4, 2, 5)).toBe(40);
    expect(computeAssessmentCoveragePct(0, 0, 5)).toBeNull();
  });
});
