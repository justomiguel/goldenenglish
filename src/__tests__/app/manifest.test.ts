import { describe, it, expect, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: () => mockBrandPublic,
}));

vi.mock("@/lib/theme/themeParser", () => ({
  loadProperties: () => ({}),
  getProperty: (_p: unknown, key: string, fallback?: string) => {
    if (key === "color.background") return "#FAFAFA";
    if (key === "color.primary") return "#103A5C";
    return fallback ?? "";
  },
}));

import manifest from "@/app/manifest";

describe("app/manifest", () => {
  it("builds manifest from brand and theme tokens", () => {
    const m = manifest();
    expect(m.name).toBe(mockBrandPublic.name);
    expect(m.short_name).toBe(mockBrandPublic.name);
    expect(m.description).toBe(mockBrandPublic.tagline);
    expect(m.theme_color).toBe("#103A5C");
    expect(m.background_color).toBe("#FAFAFA");
    expect(m.icons?.some((i) => i.src.includes("android-chrome"))).toBe(true);
  });
});
