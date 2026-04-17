import { describe, it, expect, vi, beforeEach } from "vitest";

// REGRESSION CHECK: loadEffectiveProperties is the single I/O entry consumed
// by src/app/layout.tsx. Defaults from system.properties must always come
// through, and overrides for whitelisted prefixes must replace them.

const loadProperties = vi.fn();
const loadActiveTheme = vi.fn();

vi.mock("@/lib/theme/themeParser", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/theme/themeParser")>(
      "@/lib/theme/themeParser",
    );
  return {
    ...actual,
    loadProperties: () => loadProperties(),
  };
});

vi.mock("@/lib/theme/loadActiveTheme", () => ({
  loadActiveTheme: () => loadActiveTheme(),
}));

beforeEach(() => {
  loadProperties.mockReset();
  loadActiveTheme.mockReset();
});

describe("loadEffectiveProperties", () => {
  it("returns defaults verbatim when no theme is active", async () => {
    loadProperties.mockReturnValue({
      "color.primary": "#103A5C",
      "layout.max.width": "1280px",
    });
    loadActiveTheme.mockResolvedValue(null);
    const { loadEffectiveProperties } = await import(
      "@/lib/theme/loadEffectiveProperties"
    );
    const out = await loadEffectiveProperties();
    expect(out.activeThemeSlug).toBeNull();
    expect(out.properties["color.primary"]).toBe("#103A5C");
  });

  it("merges allowed overrides on top of defaults", async () => {
    loadProperties.mockReturnValue({
      "color.primary": "#103A5C",
      "color.secondary": "#A31A22",
      "legal.age.majority": "18",
    });
    loadActiveTheme.mockResolvedValue({
      theme: {
        id: "t-1",
        slug: "navidad",
        name: "Navidad",
        isActive: true,
        properties: {
          "color.primary": "#0A253D",
          "legal.age.majority": "21",
        },
        content: {},
        createdAt: "x",
        updatedAt: "x",
        updatedBy: null,
      },
      media: [],
    });
    const { loadEffectiveProperties } = await import(
      "@/lib/theme/loadEffectiveProperties"
    );
    const out = await loadEffectiveProperties();
    expect(out.activeThemeSlug).toBe("navidad");
    expect(out.properties["color.primary"]).toBe("#0A253D");
    expect(out.properties["color.secondary"]).toBe("#A31A22");
    /** legal.age.majority is outside the override whitelist and stays default. */
    expect(out.properties["legal.age.majority"]).toBe("18");
  });
});
