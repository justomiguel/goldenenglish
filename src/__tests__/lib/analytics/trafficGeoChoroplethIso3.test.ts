import { describe, expect, it } from "vitest";
import { iso3FromChoroplethGeography } from "@/lib/analytics/trafficGeoChoropleth";

describe("iso3FromChoroplethGeography", () => {
  it("uses top-level id when present", () => {
    expect(iso3FromChoroplethGeography({ id: "arg", properties: {} })).toBe("ARG");
  });

  it("reads ISO_A3 from properties", () => {
    expect(
      iso3FromChoroplethGeography({
        properties: { ISO_A3: "USA", name: "United States" },
      }),
    ).toBe("USA");
  });

  it("returns empty when no usable code", () => {
    expect(iso3FromChoroplethGeography({ properties: { ISO_A3: "-99" } })).toBe("");
  });
});
