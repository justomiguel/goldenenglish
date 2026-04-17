import { describe, it, expect } from "vitest";
import { choroplethGeographyFill, trafficGeoRowsToIso3Counts } from "@/lib/analytics/trafficGeoChoropleth";

describe("trafficGeoRowsToIso3Counts", () => {
  it("maps alpha-2 to alpha-3 and sums counts", () => {
    const m = trafficGeoRowsToIso3Counts([
      { country: "AR", cnt: 10 },
      { country: "ar", cnt: 5 },
      { country: "US", cnt: 3 },
    ]);
    expect(m.get("ARG")).toBe(15);
    expect(m.get("USA")).toBe(3);
  });

  it("skips unknown and empty", () => {
    const m = trafficGeoRowsToIso3Counts([
      { country: "UNKNOWN", cnt: 99 },
      { country: "", cnt: 1 },
    ]);
    expect(m.size).toBe(0);
  });
});

describe("choroplethGeographyFill", () => {
  it("uses muted when no data", () => {
    expect(choroplethGeographyFill(0, false)).toEqual({ fill: "var(--color-muted, #d9d7cf)" });
  });

  it("uses primary with full opacity at max intensity", () => {
    expect(choroplethGeographyFill(1, true)).toEqual({
      fill: "var(--color-primary, #103A5C)",
      fillOpacity: 1,
    });
  });

  it("uses primary with partial opacity at low relative traffic", () => {
    const s = choroplethGeographyFill(0, true);
    expect(s.fill).toBe("var(--color-primary, #103A5C)");
    expect(s.fillOpacity).toBeCloseTo(0.45, 5);
  });
});
