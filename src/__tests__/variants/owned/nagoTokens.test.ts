import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import { NAGO_FONT_IDS, NAGO_PRIVATE, nagoDesignTokens } from "@/variants/owned/nago/tokens";

describe("nagoDesignTokens", () => {
  it("maps the landing colors and catalog fonts", () => {
    const tokens = nagoDesignTokens();
    expect(tokens.color.background).toBe("#070707");
    expect(tokens.color.surface).toBe("#141414");
    expect(tokens.color.foreground).toBe("#f3eee4");
    expect(tokens.color.primary).toBe("#c9a227");
    expect(tokens.color["primary.foreground"]).toBe("#111111");
    expect(tokens.color.muted).toBe("#1c1c1c");
    expect(tokens.color["muted.foreground"]).toBe("#c9c2b6");
    expect(tokens.color.border).toBe("#c9a227");
    expect(tokens.font).toEqual(NAGO_FONT_IDS);
    expect(tokens.motion.level).toBe("expressive");
    expect(NAGO_PRIVATE.line).toBe("#453911");
    expect(NAGO_PRIVATE.green).toBe("#1f6b3a");
    expect(tokens.color.border).not.toBe(NAGO_PRIVATE.line);
  });

  it("passes the token contrast check for nago", () => {
    const tokens = nagoDesignTokens();
    const properties = {
      "font.heading": tokens.font.heading,
      "font.body": tokens.font.body,
      "type.scale": tokens.type.scale,
      "space.density": tokens.space.density,
      "motion.level": tokens.motion.level,
      ...Object.fromEntries(Object.entries(tokens.color).map(([key, value]) => [`color.${key}`, value])),
    };
    expect(validateDesignTokens(properties, { tenantSlug: "nago" })).toEqual({ ok: true });
  });
});
