import { describe, expect, it } from "vitest";
import { marketingFontPreload } from "@/lib/landing/marketingFontPreload";

describe("marketingFontPreload", () => {
  it("preloads only the LCP face", () => {
    expect(marketingFontPreload("lcp")).toBe(true);
    expect(marketingFontPreload("lazy")).toBe(false);
  });
});
