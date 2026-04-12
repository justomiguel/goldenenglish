import { describe, it, expect } from "vitest";
import { fillForIntensity, trafficGeoRowsToIso3Counts } from "@/lib/analytics/trafficGeoChoropleth";

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

describe("fillForIntensity", () => {
  it("uses muted when no data", () => {
    expect(fillForIntensity(0, false)).toBe("var(--color-muted)");
  });

  it("mixes primary at full intensity", () => {
    expect(fillForIntensity(1, true)).toContain("color-mix");
    expect(fillForIntensity(1, true)).toContain("100%");
  });
});
