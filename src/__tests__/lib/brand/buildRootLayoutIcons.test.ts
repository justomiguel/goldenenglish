import { describe, it, expect } from "vitest";
import { buildRootLayoutIcons } from "@/lib/brand/buildRootLayoutIcons";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("buildRootLayoutIcons", () => {
  it("uses favicon_io sibling PNGs for site-relative favicon/logo", () => {
    const icons = buildRootLayoutIcons(mockBrandPublic);
    expect(icons).toBeDefined();
    const list = icons?.icon;
    expect(Array.isArray(list)).toBe(true);
    const urls = (list as { url: string }[]).map((i) => i.url);
    expect(urls.some((u) => u.includes("favicon-16x16.png"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/favicon_io/favicon.ico"))).toBe(true);
    expect(icons?.apple).toContain("/favicon_io/apple-touch-icon.png");
  });

  it("does not invent sibling PNG paths under a remote favicon URL", () => {
    const icons = buildRootLayoutIcons({
      ...mockBrandPublic,
      faviconPath: "https://cdn.example/tenant-a/favicon.ico",
      logoPath: "https://cdn.example/tenant-a/logo.png",
    });
    const list = icons?.icon as { url: string }[];
    expect(list?.every((i) => /^https:\/\/cdn\.example\//i.test(i.url))).toBe(
      true,
    );
    expect(JSON.stringify(icons)).not.toContain("favicon-16x16");
  });
});
