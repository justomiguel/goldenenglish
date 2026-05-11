import { describe, it, expect } from "vitest";
import { normalizeGooglePlaceIdForStorage } from "@/lib/maps/normalizeGooglePlaceId";

describe("normalizeGooglePlaceIdForStorage", () => {
  it("strips places/ resource prefix", () => {
    expect(normalizeGooglePlaceIdForStorage("places/ChIJxyz")).toBe("ChIJxyz");
  });

  it("passes through legacy place ids", () => {
    expect(normalizeGooglePlaceIdForStorage("ChIJxyz")).toBe("ChIJxyz");
  });

  it("returns null for empty", () => {
    expect(normalizeGooglePlaceIdForStorage("")).toBeNull();
    expect(normalizeGooglePlaceIdForStorage(null)).toBeNull();
  });
});
