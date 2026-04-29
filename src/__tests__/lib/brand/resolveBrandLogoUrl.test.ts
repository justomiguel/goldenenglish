import { describe, it, expect } from "vitest";
import { resolveBrandLogoAbsoluteUrl } from "@/lib/brand/resolveBrandLogoUrl";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("resolveBrandLogoAbsoluteUrl", () => {
  it("returns https URLs unchanged", () => {
    const b = {
      ...mockBrandPublic,
      logoPath: "https://cdn.example/logo.png",
    };
    expect(resolveBrandLogoAbsoluteUrl(b, "https://site.com")).toBe(
      "https://cdn.example/logo.png",
    );
  });

  it("prefixes origin for root-relative paths", () => {
    expect(resolveBrandLogoAbsoluteUrl(mockBrandPublic, "https://site.com")).toBe(
      "https://site.com/images/logo.png",
    );
  });
});
