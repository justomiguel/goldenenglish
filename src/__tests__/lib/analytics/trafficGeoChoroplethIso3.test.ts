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

  it("falls back to country name (English) when no ISO code is present", () => {
    expect(iso3FromChoroplethGeography({ properties: { name: "Argentina" } })).toBe("ARG");
    expect(iso3FromChoroplethGeography({ properties: { name: "United States of America" } })).toBe(
      "USA",
    );
    expect(iso3FromChoroplethGeography({ properties: { name: "Russia" } })).toBe("RUS");
    expect(iso3FromChoroplethGeography({ properties: { name: "Czech Republic" } })).toBe("CZE");
  });

  it("recognises country names in Spanish when locale is es", () => {
    expect(
      iso3FromChoroplethGeography({ properties: { name: "Estados Unidos" } }, "es"),
    ).toBe("USA");
  });

  it("returns empty for unknown labels", () => {
    expect(iso3FromChoroplethGeography({ properties: { name: "Atlantis" } })).toBe("");
  });
});
