import { describe, expect, it } from "vitest";
import {
  normalizeThemeSlug,
  suggestDuplicatedThemeSlug,
} from "@/lib/cms/normalizeThemeSlug";

// REGRESSION CHECK: normalizeThemeSlug feeds the public.site_themes.slug UNIQUE
// column. Any silent change in transliteration / collapsing rules can break
// backwards compatibility with already-stored rows. Tests pin the expected
// behavior so the admin UI keeps producing predictable URLs.

describe("normalizeThemeSlug", () => {
  it("collapses whitespace and accents into kebab-case ASCII", () => {
    expect(normalizeThemeSlug("Tema de Navidad 2026")).toBe("tema-de-navidad-2026");
    expect(normalizeThemeSlug(" Aniversario  20 Años ")).toBe("aniversario-20-anos");
  });

  it("returns null when the input is empty after stripping", () => {
    expect(normalizeThemeSlug("")).toBeNull();
    expect(normalizeThemeSlug("   ")).toBeNull();
    expect(normalizeThemeSlug("---")).toBeNull();
    expect(normalizeThemeSlug("////")).toBeNull();
  });

  it("trims to 64 characters without leaving trailing dashes", () => {
    const long = "x".repeat(80);
    const slug = normalizeThemeSlug(long);
    expect(slug).not.toBeNull();
    expect((slug ?? "").length).toBeLessThanOrEqual(64);
    expect(slug).not.toMatch(/-$/);
  });

  it("never accepts non-string input", () => {
    expect(normalizeThemeSlug(123 as unknown as string)).toBeNull();
    expect(normalizeThemeSlug(null as unknown as string)).toBeNull();
  });
});

describe("suggestDuplicatedThemeSlug", () => {
  it("appends -copy when no collision exists", () => {
    expect(suggestDuplicatedThemeSlug("default", new Set())).toBe("default-copy");
  });

  it("avoids stacking copy suffixes (default-copy duplicated stays default-copy-2, not default-copy-copy)", () => {
    expect(
      suggestDuplicatedThemeSlug("default-copy", new Set(["default-copy"])),
    ).toBe("default-copy-2");
  });

  it("walks the suffix until a free slot is found", () => {
    const taken = new Set(["x-copy", "x-copy-2", "x-copy-3"]);
    expect(suggestDuplicatedThemeSlug("x", taken)).toBe("x-copy-4");
  });

  it("falls back to a deterministic shape when the slug is unparseable", () => {
    expect(suggestDuplicatedThemeSlug("///", new Set())).toBe("theme-copy");
  });
});
