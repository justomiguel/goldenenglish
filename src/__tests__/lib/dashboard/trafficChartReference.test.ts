import { describe, expect, it } from "vitest";
import { trafficChartReference } from "@/lib/dashboard/trafficChartReference";

describe("trafficChartReference", () => {
  it("exposes min, max and date ends from the series", () => {
    expect(
      trafficChartReference([
        { day: "2026-08-01", visits: 15 },
        { day: "2026-08-02", visits: 31 },
        { day: "2026-08-03", visits: 8 },
      ]),
    ).toEqual({
      min: 8,
      max: 31,
      firstDay: "2026-08-01",
      lastDay: "2026-08-03",
    });
  });
});
