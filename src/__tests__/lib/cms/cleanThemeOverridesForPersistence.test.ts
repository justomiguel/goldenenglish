import { describe, expect, it } from "vitest";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";

describe("cleanThemeOverridesForPersistence", () => {
  const defaults = {
    "color.primary": "#103A5C",
    "color.secondary": "#A31A22",
    "layout.max.width": "1280px",
    "app.name": "Golden English",
    "legal.age.majority": "18",
  };

  it("drops keys outside the allow-list", () => {
    const cleaned = cleanThemeOverridesForPersistence(defaults, {
      "color.primary": "#000000",
      "legal.age.majority": "21",
      "analytics.timezone": "UTC",
    });
    expect(cleaned).toEqual({ "color.primary": "#000000" });
  });

  it("drops empty / whitespace-only values", () => {
    const cleaned = cleanThemeOverridesForPersistence(defaults, {
      "color.primary": "",
      "color.secondary": "   ",
      "layout.max.width": "1440px",
    });
    expect(cleaned).toEqual({ "layout.max.width": "1440px" });
  });

  it("drops values that match the default", () => {
    const cleaned = cleanThemeOverridesForPersistence(defaults, {
      "color.primary": "#103A5C",
      "color.secondary": "#000000",
    });
    expect(cleaned).toEqual({ "color.secondary": "#000000" });
  });

  it("trims values before persisting", () => {
    const cleaned = cleanThemeOverridesForPersistence(defaults, {
      "color.primary": "  #abcdef  ",
    });
    expect(cleaned["color.primary"]).toBe("#abcdef");
  });

  it("returns keys sorted alphabetically (diff-friendly JSONB)", () => {
    const cleaned = cleanThemeOverridesForPersistence(defaults, {
      "layout.max.width": "1440px",
      "color.primary": "#000000",
      "app.name": "Custom",
    });
    expect(Object.keys(cleaned)).toEqual([
      "app.name",
      "color.primary",
      "layout.max.width",
    ]);
  });

  it("ignores non-string values defensively", () => {
    const raw: Record<string, unknown> = {
      "color.primary": 123,
      "color.secondary": null,
    };
    const cleaned = cleanThemeOverridesForPersistence(
      defaults,
      raw as Record<string, string>,
    );
    expect(cleaned).toEqual({});
  });
});
