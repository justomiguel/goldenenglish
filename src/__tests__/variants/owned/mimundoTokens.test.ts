import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import { MIMUNDO_FONT_IDS, MIMUNDO_PRIVATE, mimundoDesignTokens } from "@/variants/owned/mimundo/tokens";

describe("mimundoDesignTokens", () => {
  it("maps the landing colors and catalog fonts", () => {
    const tokens = mimundoDesignTokens();
    expect(tokens.color.background).toBe("#fff8ec");
    expect(tokens.color.surface).toBe("#faf6ea");
    expect(tokens.color.foreground).toBe("#3b2f2a");
    expect(tokens.color.primary).toBe("#3e5c33");
    expect(tokens.color["primary.foreground"]).toBe("#fff8ec");
    expect(tokens.color.muted).toBe("#faf6ea");
    expect(tokens.color["muted.foreground"]).toBe("#6d4c41");
    expect(tokens.color.border).toBe("#3e5c33");
    expect(tokens.font).toEqual(MIMUNDO_FONT_IDS);
    expect(tokens.motion.level).toBe("expressive");
    expect(MIMUNDO_PRIVATE.line).toBe("#c9ccb8");
    expect(MIMUNDO_PRIVATE.pink).toBe("#ec2e88");
    expect(MIMUNDO_PRIVATE.accent).toBe("caveat");
    expect(tokens.color.border).not.toBe(MIMUNDO_PRIVATE.line);
  });

  it("passes the token contrast check for mimundo", () => {
    const tokens = mimundoDesignTokens();
    const properties = {
      "font.heading": tokens.font.heading,
      "font.body": tokens.font.body,
      "type.scale": tokens.type.scale,
      "space.density": tokens.space.density,
      "motion.level": tokens.motion.level,
      ...Object.fromEntries(Object.entries(tokens.color).map(([key, value]) => [`color.${key}`, value])),
    };
    expect(validateDesignTokens(properties, { tenantSlug: "mimundo" })).toEqual({ ok: true });
  });
});
