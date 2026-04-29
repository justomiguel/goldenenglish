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
});
