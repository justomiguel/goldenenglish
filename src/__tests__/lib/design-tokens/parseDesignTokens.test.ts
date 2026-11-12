import { describe, expect, it } from "vitest";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";

describe("parseDesignTokens", () => {
  it("parses Golden defaults to catalog font ids and standard levels", () => {
    const tokens = parseDesignTokens({ ...SYSTEM_PROPERTIES_DEFAULTS });

    expect(tokens.version).toBe(1);
    expect(tokens.font.heading).toBe("fraunces");
    expect(tokens.font.body).toBe("dm-sans");
    expect(tokens.color.primary).toBe("#103A5C");
    expect(tokens.color["primary.foreground"]).toBe("#FFFFFF");
    expect(tokens.color.background).toBe("#FAF9F6");
    expect(tokens.type.scale).toBe("standard");
    expect(tokens.type.headingWeight).toBe(600);
    expect(tokens.radius.control).toBe("0.75rem");
    expect(tokens.radius.card).toBe("0.75rem");
    expect(tokens.space.density).toBe("standard");
    expect(tokens.motion.level).toBe("subtle");
    expect(tokens.shadow.soft).toBe(SYSTEM_PROPERTIES_DEFAULTS["shadow.soft"]);
  });

  it("reads layout.border.radius when radius.card is empty", () => {
    const tokens = parseDesignTokens({
      ...SYSTEM_PROPERTIES_DEFAULTS,
      "radius.card": "   ",
      "layout.border.radius": "1rem",
    });

    expect(tokens.radius.card).toBe("1rem");
  });

  it("maps font.secondary to a catalog id when font.heading is empty", () => {
    const tokens = parseDesignTokens({
      ...SYSTEM_PROPERTIES_DEFAULTS,
      "font.heading": "",
      "font.secondary": "outfit",
    });

    expect(tokens.font.heading).toBe("outfit");
  });

  it("falls back to the default heading id when the family name is unknown", () => {
    const tokens = parseDesignTokens({
      ...SYSTEM_PROPERTIES_DEFAULTS,
      "font.heading": "",
      "font.secondary": "Comic Sans",
    });

    expect(tokens.font.heading).toBe("fraunces");
  });

  it("falls back to the default enum and does not throw", () => {
    const tokens = parseDesignTokens({
      ...SYSTEM_PROPERTIES_DEFAULTS,
      "type.scale": "huge",
      "space.density": "packed",
      "motion.level": "wild",
    });

    expect(tokens.type.scale).toBe("standard");
    expect(tokens.space.density).toBe("standard");
    expect(tokens.motion.level).toBe("subtle");
  });
});
