import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import { matissDesignTokens, MATISS_FONT_IDS, MATISS_PRIVATE } from "@/variants/owned/matiss/tokens";

describe("matissDesignTokens", () => {
  it("maps the landing colors and catalog fonts", () => {
    const tokens = matissDesignTokens();
    expect(tokens.color.background).toBe("#fcf4f7");
    expect(tokens.color.primary).toBe("#6b4c9e");
    expect(tokens.color.foreground).toBe("#3a2a52");
    expect(tokens.color.muted).toBe("#f0e4f0");
    expect(tokens.font).toEqual(MATISS_FONT_IDS);
    expect(tokens.motion.level).toBe("expressive");
    expect(MATISS_PRIVATE.line).toBe("#d8c0e4");
    expect(tokens.color.border).toBe("#a080b0");
  });

  it("passes the token contrast check for matiss", () => {
    const tokens = matissDesignTokens();
    const properties = {
      "font.heading": tokens.font.heading,
      "font.body": tokens.font.body,
      "type.scale": tokens.type.scale,
      "space.density": tokens.space.density,
      "motion.level": tokens.motion.level,
      ...Object.fromEntries(Object.entries(tokens.color).map(([key, value]) => [`color.${key}`, value])),
    };
    expect(validateDesignTokens(properties, { tenantSlug: "matiss" })).toEqual({ ok: true });
  });
});
