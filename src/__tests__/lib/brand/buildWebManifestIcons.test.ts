import { describe, it, expect } from "vitest";
import { buildWebManifestIcons } from "@/lib/brand/buildWebManifestIcons";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("buildWebManifestIcons", () => {
  it("uses CentroListo sibling PNGs when the favicon lives under /centrolisto", () => {
    const icons = buildWebManifestIcons({
      ...mockBrandPublic,
      faviconPath: "/centrolisto/favicon.ico",
      logoPath: "/centrolisto/android-chrome-512x512.png",
    });
    expect(icons.some((i) => i.src === "/centrolisto/android-chrome-192x192.png")).toBe(true);
    expect(icons.some((i) => i.src === "/centrolisto/android-chrome-512x512.png")).toBe(true);
    expect(icons.some((i) => i.src.includes("favicon_io"))).toBe(false);
    expect(icons.some((i) => i.src === "/images/logo.png")).toBe(false);
  });

  it("uses favicon_io sibling PNGs for relative paths", () => {
    const icons = buildWebManifestIcons(mockBrandPublic);
    expect(icons.some((i) => i.src.includes("android-chrome-192x192"))).toBe(true);
    expect(icons.some((i) => i.src.endsWith("/images/logo.png"))).toBe(true);
  });

  it("uses the install route when a remote mark has no sized bundle", () => {
    const icons = buildWebManifestIcons({
      ...mockBrandPublic,
      faviconPath: "https://storage.example/f.ico",
      logoPath: "https://storage.example/logo.png",
    });
    expect(icons.some((icon) => icon.src === "/pwa/icon/192" && icon.sizes === "192x192")).toBe(true);
    expect(icons.some((icon) => icon.src === "/pwa/icon/512" && icon.sizes === "512x512")).toBe(true);
    expect(icons.some((icon) => icon.src.includes("storage.example"))).toBe(false);
  });

  it("points a lone PNG mark at exact 192 and 512 install icons", () => {
    const icons = buildWebManifestIcons({
      ...mockBrandPublic,
      faviconPath: "/images/matiss/logo/logo.png",
      logoPath: "/images/matiss/logo/logo.png",
    });
    expect(icons.some((icon) => icon.src === "/pwa/icon/192" && icon.sizes === "192x192")).toBe(true);
    expect(icons.some((icon) => icon.src === "/pwa/icon/512" && icon.sizes === "512x512")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "48x48")).toBe(false);
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(false);
  });

  it("does not invent android-chrome paths for root-relative SVG favicon", () => {
    const icons = buildWebManifestIcons({
      ...mockBrandPublic,
      faviconPath: "/file.svg",
      logoPath: "/file.svg",
    });
    expect(icons.some((icon) => icon.src === "/pwa/icon/192" && icon.sizes === "192x192")).toBe(true);
    expect(icons.some((icon) => icon.src === "/pwa/icon/512" && icon.sizes === "512x512")).toBe(true);
    expect(icons.some((i) => i.src.includes("android-chrome"))).toBe(false);
    expect(icons.some((i) => i.src === "/file.svg")).toBe(false);
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
