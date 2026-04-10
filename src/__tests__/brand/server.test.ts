import { describe, it, expect } from "vitest";
import { getBrandPublic } from "@/lib/brand/server";

describe("getBrandPublic", () => {
  it("loads branding from system.properties", () => {
    const b = getBrandPublic();
    expect(b.name.length).toBeGreaterThan(0);
    expect(b.taglineEn.length).toBeGreaterThan(0);
    expect(b.logoPath.startsWith("/")).toBe(true);
    expect(b.faviconPath).toContain("favicon");
  });
});
