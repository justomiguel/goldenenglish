import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBrandPublic } from "@/lib/brand/server";

vi.mock("@/lib/theme/loadEffectiveProperties", () => ({
  loadEffectiveProperties: vi.fn(),
}));

import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import type { ThemeProperties } from "@/lib/theme/themeParser";

describe("getBrandPublic", () => {
  it("loads branding from system.properties", () => {
    const b = getBrandPublic();
    expect(b.name.length).toBeGreaterThan(0);
    expect(b.taglineEn.length).toBeGreaterThan(0);
    expect(b.logoPath.startsWith("/")).toBe(true);
    expect(b.faviconPath).toContain("favicon");
  });
});

describe("getBrandForRequest", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses merged properties from loadEffectiveProperties", async () => {
    vi.mocked(loadEffectiveProperties).mockResolvedValue({
      properties: {
        "app.name": "Overlay Institute",
        "app.tagline": "Overlay tagline",
        "app.tagline.en": "Overlay EN",
        "app.legal.name": "Overlay Legal",
        "app.legal.registry": "",
        "app.logo.path": "/images/logo.png",
        "app.logo.alt": "Alt",
        "app.favicon.path": "/favicon_io/favicon.ico",
        "contact.email": "",
        "contact.phone": "",
        "contact.address": "",
        "social.facebook": "",
        "social.instagram": "",
        "social.whatsapp": "",
      } satisfies ThemeProperties,
      activeThemeSlug: "test-theme",
    });

    const { getBrandForRequest } = await import("@/lib/brand/server");
    const b = await getBrandForRequest();
    expect(b.name).toBe("Overlay Institute");
    expect(b.tagline).toBe("Overlay tagline");

    const b2 = await getBrandForRequest();
    expect(b2).toStrictEqual(b);
  });
});
