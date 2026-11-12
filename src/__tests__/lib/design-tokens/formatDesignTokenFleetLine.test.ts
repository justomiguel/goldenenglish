import { describe, expect, it } from "vitest";
import { formatDesignTokenFleetLine } from "@/lib/design-tokens/formatDesignTokenFleetLine";

describe("formatDesignTokenFleetLine", () => {
  it("prints slug, code, token, pair, and ratio", () => {
    expect(
      formatDesignTokenFleetLine("golden", {
        code: "contrast_below_aa",
        token: "color.primary",
        pair: "color.primary.foreground",
        ratio: 1.07,
      }),
    ).toBe("golden contrast_below_aa color.primary color.primary.foreground 1.07");
  });

  it("uses a dash when pair and ratio are absent", () => {
    expect(
      formatDesignTokenFleetLine("nago", {
        code: "font_not_in_catalog",
        token: "font.heading",
      }),
    ).toBe("nago font_not_in_catalog font.heading - -");
  });
});
