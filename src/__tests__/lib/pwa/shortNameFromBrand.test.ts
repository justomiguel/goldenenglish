import { describe, expect, it } from "vitest";
import { shortNameFromBrand } from "@/lib/pwa/shortNameFromBrand";

describe("shortNameFromBrand", () => {
  it("cuts a long name at the last word that fits", () => {
    expect(shortNameFromBrand("Instituto Golden English", null)).toBe("Instituto");
  });

  it("cuts an explicit value at 12 characters", () => {
    expect(shortNameFromBrand("Club", "abcdefghijklm")).toBe("abcdefghijkl");
  });

  it("cuts a one-word name of 15 characters to 12", () => {
    expect(shortNameFromBrand("Supercalifragil", null)).toBe("Supercalifra");
  });
});
