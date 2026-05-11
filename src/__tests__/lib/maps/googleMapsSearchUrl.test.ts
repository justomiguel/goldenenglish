import { describe, expect, it } from "vitest";
import { googleMapsSearchUrl } from "@/lib/maps/googleMapsSearchUrl";

describe("googleMapsSearchUrl", () => {
  it("prefers place id when present", () => {
    expect(googleMapsSearchUrl("x", "ChIJabc")).toBe(
      "https://www.google.com/maps/search/?api=1&query_place_id=ChIJabc",
    );
  });

  it("falls back to query text", () => {
    expect(googleMapsSearchUrl("Santiago, Chile", null)).toBe(
      "https://www.google.com/maps/search/?api=1&query=Santiago%2C%20Chile",
    );
  });

  it("returns null when nothing usable", () => {
    expect(googleMapsSearchUrl("", null)).toBeNull();
    expect(googleMapsSearchUrl("  ", undefined)).toBeNull();
  });
});
