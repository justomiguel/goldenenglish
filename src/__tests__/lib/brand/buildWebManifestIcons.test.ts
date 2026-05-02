import { describe, it, expect } from "vitest";
import { buildWebManifestIcons } from "@/lib/brand/buildWebManifestIcons";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("buildWebManifestIcons", () => {
  it("uses favicon_io sibling PNGs for relative paths", () => {
    const icons = buildWebManifestIcons(mockBrandPublic);
    expect(icons.some((i) => i.src.includes("android-chrome-192x192"))).toBe(true);
    expect(icons.some((i) => i.src.endsWith("/images/logo.png"))).toBe(true);
  });

  it("emits remote favicon and logo only when absolute", () => {
    const icons = buildWebManifestIcons({
      ...mockBrandPublic,
      faviconPath: "https://storage.example/f.ico",
      logoPath: "https://storage.example/logo.png",
    });
    expect(icons).toHaveLength(2);
    expect(icons[0]?.src).toContain("storage.example");
    expect(icons[1]?.src).toContain("logo.png");
  });

  it("does not invent android-chrome paths for root-relative SVG favicon", () => {
    const icons = buildWebManifestIcons({
      ...mockBrandPublic,
      faviconPath: "/file.svg",
      logoPath: "/file.svg",
    });
    expect(icons).toHaveLength(1);
    expect(icons[0]?.src).toBe("/file.svg");
    expect(icons.some((i) => i.src.includes("android-chrome"))).toBe(false);
  });

  it("emits manifest icons for storage favicon bundle prefix", () => {
    const icons = buildWebManifestIcons({
      ...mockBrandPublic,
      faviconPath: "https://cdn.example/tenant/favicon.ico",
      faviconBundlePrefix: "tid/wizard/favicon-bundle-abc",
    });
    expect(icons.length).toBe(4);
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512")).toBe(true);
  });
});
