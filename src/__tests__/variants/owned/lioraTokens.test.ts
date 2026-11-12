import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import { LIORA_FONT_IDS, LIORA_PRIVATE, lioraDesignTokens } from "@/variants/owned/liora/tokens";

describe("lioraDesignTokens", () => {
  it("maps the landing colors and catalog fonts", () => {
    const tokens = lioraDesignTokens();
    expect(tokens.color.background).toBe("#fcf2f1");
    expect(tokens.color.surface).toBe("#fff8f8");
    expect(tokens.color.foreground).toBe("#4a3f40");
    expect(tokens.color.primary).toBe("#b84f61");
    expect(tokens.color["primary.foreground"]).toBe("#ffffff");
    expect(tokens.color.muted).toBe("#f3e4e2");
    expect(tokens.color["muted.foreground"]).toBe("#6b5f58");
    expect(tokens.font).toEqual(LIORA_FONT_IDS);
    expect(tokens.motion.level).toBe("expressive");
    expect(LIORA_PRIVATE.line).toBe("#f0d9da");
    expect(LIORA_PRIVATE.rose).toBe("#e48a94");
    expect(LIORA_PRIVATE.script).toBe("allura");
    expect(tokens.color.border).not.toBe(LIORA_PRIVATE.line);
  });

  it("passes the token contrast check for liora", () => {
    const tokens = lioraDesignTokens();
    const properties = {
      "font.heading": tokens.font.heading,
      "font.body": tokens.font.body,
      "type.scale": tokens.type.scale,
      "space.density": tokens.space.density,
      "motion.level": tokens.motion.level,
      ...Object.fromEntries(Object.entries(tokens.color).map(([key, value]) => [`color.${key}`, value])),
    };
    expect(validateDesignTokens(properties, { tenantSlug: "liora" })).toEqual({ ok: true });
  });
});
