import { describe, it, expect, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: vi.fn(() => Promise.resolve(mockBrandPublic)),
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

import manifest from "@/app/manifest";

describe("app/manifest", () => {
  it("builds manifest from brand and theme tokens", async () => {
    const m = await manifest();
    expect(m.name).toBe(mockBrandPublic.name);
    expect(m.short_name).toBe(mockBrandPublic.name);
    expect(m.description).toBe(mockBrandPublic.tagline);
    expect(m.theme_color).toBe("#103A5C");
    expect(m.background_color).toBe("#FAFAFA");
    expect(m.icons?.some((i) => i.src.includes("android-chrome"))).toBe(true);
  });
});
