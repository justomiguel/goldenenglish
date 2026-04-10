import { describe, it, expect } from "vitest";
import {
  brandLogoManifestIcon,
  faviconPublicDir,
} from "@/lib/brand/faviconDir";

describe("faviconPublicDir", () => {
  it("returns parent path of favicon.ico", () => {
    expect(faviconPublicDir("/favicon_io/favicon.ico")).toBe("/favicon_io");
  });

  it("returns empty for root-only path", () => {
    expect(faviconPublicDir("favicon.ico")).toBe("");
  });
});

describe("brandLogoManifestIcon", () => {
  it("detects svg", () => {
    expect(brandLogoManifestIcon("/a/B.svg")).toEqual({
      type: "image/svg+xml",
      sizes: "any",
    });
  });

  it("detects png and webp", () => {
    expect(brandLogoManifestIcon("/x.png").type).toBe("image/png");
    expect(brandLogoManifestIcon("/x.webp").type).toBe("image/webp");
  });

  it("defaults raster manifest icon for unknown extensions", () => {
    expect(brandLogoManifestIcon("/logo.jpg")).toEqual({
      type: "image/png",
      sizes: "512x512",
    });
  });
});
