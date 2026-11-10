import { describe, it, expect, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: vi.fn(() => Promise.resolve(mockBrandPublic)),
}));

vi.mock("@/lib/theme/loadActiveTheme", () => ({
  loadActiveTheme: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/theme/loadEffectiveProperties", () => ({
  loadEffectiveProperties: vi.fn(() =>
    Promise.resolve({
      properties: {
        "color.background": "#FAFAFA",
        "color.primary": "#103A5C",
      },
      activeThemeSlug: "test",
    }),
  ),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: (name: string) => (name === "x-ge-locale" ? "en" : null),
    }),
  ),
}));

import { getBrandForRequest } from "@/lib/brand/server";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { NAGO_BUNDLED_LOGO } from "@/lib/landing/nagoLogo";
import manifest from "@/app/manifest";

describe("app/manifest", () => {
  it("builds manifest from brand and theme tokens", async () => {
    const m = await manifest();
    expect(m.name).toBe(mockBrandPublic.name);
    expect(m.short_name).toBe(mockBrandPublic.name);
    expect(m.description).toBe(mockBrandPublic.tagline);
    expect(m.theme_color).toBe("#103A5C");
    expect(m.background_color).toBe("#FAFAFA");
    expect(m.lang).toBe("en");
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
    expect(m.orientation).toBe("any");
    expect(m.shortcuts?.some((item) => item.url === "/en/dashboard/student")).toBe(true);
    expect(m.shortcuts?.some((item) => item.url === "/en/dashboard/parent/payments")).toBe(true);
    expect(m.icons?.some((i) => i.src.includes("android-chrome"))).toBe(true);
  });

  it("lists exact install sizes when the mark is one PNG", async () => {
    vi.mocked(getBrandForRequest).mockResolvedValueOnce({
      ...mockBrandPublic,
      name: "Matiss Studio",
      faviconPath: "/images/matiss/logo/logo.png",
      logoPath: "/images/matiss/logo/logo.png",
    });
    const m = await manifest();
    expect(m.icons?.some((icon) => icon.src === "/pwa/icon/192" && icon.sizes === "192x192")).toBe(true);
    expect(m.icons?.some((icon) => icon.src === "/pwa/icon/512" && icon.sizes === "512x512")).toBe(true);
    expect(m.icons?.some((icon) => icon.purpose === "maskable")).toBe(false);
  });

  it("omits family shortcuts on the Centro Listo host", async () => {
    vi.mocked(getBrandForRequest).mockResolvedValueOnce({
      ...mockBrandPublic,
      name: "CentroListo",
      faviconPath: "/centrolisto/favicon.ico",
    });
    const m = await manifest();
    expect(m.shortcuts).toBeUndefined();
    expect(m.name).toBe("CentroListo");
  });

  it("uses the Nagô home mark for the installed icon", async () => {
    vi.mocked(loadActiveTheme).mockResolvedValueOnce({
      theme: { templateKind: "nago" },
    } as never);
    const m = await manifest();
    expect(m.icons?.every((icon) => icon.src === NAGO_BUNDLED_LOGO)).toBe(true);
    expect(m.icons?.some((icon) => icon.purpose === "maskable")).toBe(false);
    expect(m.background_color).toBe("#070707");
    expect(m.theme_color).toBe("#070707");
  });
});
