import { describe, it, expect } from "vitest";
import { pivotAdminAnalyticsHourly } from "@/lib/dashboard/pivotAdminAnalyticsHourly";

describe("pivotAdminAnalyticsHourly", () => {
  it("fills 24 hours with zeros when empty", () => {
    const out = pivotAdminAnalyticsHourly([]);
    expect(out).toHaveLength(24);
    expect(out[0].hour).toBe(0);
    expect(out[0].student).toBe(0);
    expect(out[23].hour).toBe(23);
  });

  it("merges roles per hour", () => {
    const out = pivotAdminAnalyticsHourly([
      { hour: 3, role: "student", cnt: 2 },
      { hour: 3, role: "admin", cnt: 1 },
    ]);
    expect(out[3].student).toBe(2);
    expect(out[3].admin).toBe(1);
    expect(out[3].teacher).toBe(0);
  });
});
