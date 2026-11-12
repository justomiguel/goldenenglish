import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import {
  MOZARTHITOS_FONT_IDS,
  MOZARTHITOS_PRIVATE,
  mozarthitosDesignTokens,
} from "@/variants/owned/mozarthitos/tokens";

describe("mozarthitosDesignTokens", () => {
  it("maps the landing colors and catalog fonts", () => {
    const tokens = mozarthitosDesignTokens();
    expect(tokens.color.background).toBe("#ffffff");
    expect(tokens.color.surface).toBe("#fff8f2");
    expect(tokens.color.foreground).toBe("#2a2a2a");
    expect(tokens.color.primary).toBe("#9b1428");
    expect(tokens.color["primary.foreground"]).toBe("#ffffff");
    expect(tokens.color.muted).toBe("#fff8f2");
    expect(tokens.color["muted.foreground"]).toBe("#545454");
    expect(tokens.font).toEqual(MOZARTHITOS_FONT_IDS);
    expect(tokens.motion.level).toBe("expressive");
    expect(MOZARTHITOS_PRIVATE.line).toBe("#e9c6c6");
    expect(MOZARTHITOS_PRIVATE.yellow).toBe("#f3c94e");
    expect(MOZARTHITOS_PRIVATE.pink).toBe("#ff455d");
    expect(tokens.color.border).not.toBe(MOZARTHITOS_PRIVATE.line);
    expect(tokens.color.border).toBe("#545454");
  });

  it("passes the token contrast check for mozarthitos", () => {
    const tokens = mozarthitosDesignTokens();
    const properties = {
      "font.heading": tokens.font.heading,
      "font.body": tokens.font.body,
      "type.scale": tokens.type.scale,
      "space.density": tokens.space.density,
      "motion.level": tokens.motion.level,
      ...Object.fromEntries(Object.entries(tokens.color).map(([key, value]) => [`color.${key}`, value])),
    };
    expect(validateDesignTokens(properties, { tenantSlug: "mozarthitos" })).toEqual({ ok: true });
  });
});
