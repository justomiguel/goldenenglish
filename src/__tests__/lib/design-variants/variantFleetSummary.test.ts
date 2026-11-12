import { describe, expect, it } from "vitest";
import { variantFleetSummary } from "@/lib/design-variants/variantFleetSummary";

describe("variantFleetSummary", () => {
  it("groups slugs by variant id and major", () => {
    const grouped = variantFleetSummary([
      {
        slug: "north",
        sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: {} }],
      },
      {
        slug: "south",
        sections: [
          { id: "hero", variantId: "hero.bleed", major: 1, props: {} },
          { id: "close", variantId: "close.paper", major: 1, props: {} },
        ],
      },
    ]);
    expect(grouped.get("hero.bleed@1")).toEqual(["north", "south"]);
    expect(grouped.get("close.paper@1")).toEqual(["south"]);
    expect(grouped.has("hero.bleed@2")).toBe(false);
  });
});
