import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import { contrastRatio } from "@/lib/theme/contrastRatio";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

function roundedRatio(a: string, b: string): number {
  return Math.round(contrastRatio(a, b) * 100) / 100;
}

describe("validateDesignTokens", () => {
  it("accepts the Golden defaults", () => {
    expect(
      validateDesignTokens(
        { ...SYSTEM_PROPERTIES_DEFAULTS },
        { tenantSlug: "golden" },
      ),
    ).toEqual({ ok: true });
  });

  it("reports a text pair below 4.5:1", () => {
    const result = validateDesignTokens(
      {
        ...SYSTEM_PROPERTIES_DEFAULTS,
        "color.primary": "#ffff00",
        "color.primary.foreground": "#FFFFFF",
      },
      { tenantSlug: "golden" },
    );
    expect(result).toEqual({
      ok: false,
      issues: [
        {
          code: "contrast_below_aa",
          token: "color.primary",
          pair: "color.primary.foreground",
          ratio: roundedRatio("#ffff00", "#FFFFFF"),
        },
      ],
    });
  });

  it("reports a border below 3:1 on the background", () => {
    const result = validateDesignTokens(
      {
        ...SYSTEM_PROPERTIES_DEFAULTS,
        "color.background": "#ffffff",
        "color.border": "#eeeeee",
      },
      { tenantSlug: "golden" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        code: "contrast_below_aa",
        token: "color.border",
        pair: "color.background",
        ratio: roundedRatio("#eeeeee", "#ffffff"),
      });
    }
  });

  it("rejects a color that is not #RRGGBB", () => {
    const result = validateDesignTokens(
      { ...SYSTEM_PROPERTIES_DEFAULTS, "color.accent": "rgb(1,2,3)" },
      { tenantSlug: "golden" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        code: "token_invalid_color",
        token: "color.accent",
      });
    }
  });

  it("rejects an unknown density", () => {
    const result = validateDesignTokens(
      { ...SYSTEM_PROPERTIES_DEFAULTS, "space.density": "huge" },
      { tenantSlug: "golden" },
    );
    expect(result).toEqual({
      ok: false,
      issues: [{ code: "token_invalid_value", token: "space.density" }],
    });
  });

  it("rejects a font id outside the catalog", () => {
    const result = validateDesignTokens(
      { ...SYSTEM_PROPERTIES_DEFAULTS, "font.heading": "comic-sans" },
      { tenantSlug: "golden" },
    );
    expect(result).toEqual({
      ok: false,
      issues: [{ code: "font_not_in_catalog", token: "font.heading" }],
    });
  });

  it("allows an owned font only for its owner", () => {
    const properties = {
      ...SYSTEM_PROPERTIES_DEFAULTS,
      "font.heading": "espaciozenit-fast-blaze",
    };
    expect(validateDesignTokens(properties, { tenantSlug: "espaciozenit" })).toEqual({
      ok: true,
    });
    expect(validateDesignTokens(properties, { tenantSlug: "golden" })).toEqual({
      ok: false,
      issues: [{ code: "font_not_in_catalog", token: "font.heading" }],
    });
  });
});
