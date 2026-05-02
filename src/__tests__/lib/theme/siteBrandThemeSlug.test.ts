import { describe, it, expect, afterEach, vi } from "vitest";

describe("getSiteBrandThemeSlug", () => {
  afterEach(() => {
    delete process.env.SITE_BRAND_THEME_SLUG;
    vi.resetModules();
  });

  it("returns null when unset", async () => {
    const { getSiteBrandThemeSlug } = await import(
      "@/lib/theme/siteBrandThemeSlug"
    );
    expect(getSiteBrandThemeSlug()).toBeNull();
  });

  it("returns trimmed slug when set", async () => {
    process.env.SITE_BRAND_THEME_SLUG = "  mozarthitos  ";
    const { getSiteBrandThemeSlug } = await import(
      "@/lib/theme/siteBrandThemeSlug"
    );
    expect(getSiteBrandThemeSlug()).toBe("mozarthitos");
  });
});
