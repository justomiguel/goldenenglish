import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import {
  ESPACIOZENIT_FONT_IDS,
  ESPACIOZENIT_PRIVATE,
  espaciozenitDesignTokens,
} from "@/variants/owned/espaciozenit/tokens";

describe("espaciozenitDesignTokens", () => {
  it("maps the landing colors and catalog fonts", () => {
    const tokens = espaciozenitDesignTokens();
    expect(tokens.color.background).toBe("#000000");
    expect(tokens.color.surface).toBe("#070b12");
    expect(tokens.color.foreground).toBe("#ffffff");
    expect(tokens.color.primary).toBe("#4dd8ff");
    expect(tokens.color["primary.foreground"]).toBe("#041018");
    expect(tokens.color.muted).toBe("#0b1220");
    expect(tokens.color["muted.foreground"]).toBe("#c9cbce");
    expect(tokens.color.border).toBe("#00aeef");
    expect(tokens.font).toEqual(ESPACIOZENIT_FONT_IDS);
    expect(tokens.motion.level).toBe("expressive");
    expect(ESPACIOZENIT_PRIVATE.cyan).toBe("#00aeef");
    expect(ESPACIOZENIT_PRIVATE.displayFaces).toEqual([
      "espaciozenit-fast-blaze",
      "espaciozenit-rusted-vibe",
      "espaciozenit-ballet",
    ]);
    expect(tokens.color.border).not.toBe(ESPACIOZENIT_PRIVATE.line);
  });

  it("passes the token contrast check for espaciozenit", () => {
    const tokens = espaciozenitDesignTokens();
    const properties = {
      "font.heading": tokens.font.heading,
      "font.body": tokens.font.body,
      "type.scale": tokens.type.scale,
      "space.density": tokens.space.density,
      "motion.level": tokens.motion.level,
      ...Object.fromEntries(Object.entries(tokens.color).map(([key, value]) => [`color.${key}`, value])),
    };
    expect(validateDesignTokens(properties, { tenantSlug: "espaciozenit" })).toEqual({ ok: true });
  });
});
