import { describe, expect, it } from "vitest";
import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";
import { resolveTenantFonts } from "@/lib/design-tokens/resolveTenantFonts";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

describe("resolveTenantFonts", () => {
  it("falls back when an id is not in the catalog", () => {
    const tokens = parseDesignTokens({ ...SYSTEM_PROPERTIES_DEFAULTS });
    tokens.font.heading = "not-a-font";
    tokens.font.body = "also-not";

    expect(resolveTenantFonts(tokens)).toEqual({
      heading: "fraunces",
      body: "dm-sans",
    });
  });
});
