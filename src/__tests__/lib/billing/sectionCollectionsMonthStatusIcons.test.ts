import { describe, expect, it } from "vitest";
import { SECTION_COLLECTIONS_MONTH_STATUS_ICONS } from "@/lib/billing/sectionCollectionsMonthStatusIcons";

// REGRESSION CHECK: distinct glyphs help staff tell “no fee rule” from “outside billing window”.
describe("SECTION_COLLECTIONS_MONTH_STATUS_ICONS", () => {
  it("uses different icons for no-plan vs out-of-period", () => {
    expect(SECTION_COLLECTIONS_MONTH_STATUS_ICONS["no-plan"]).not.toBe(
      SECTION_COLLECTIONS_MONTH_STATUS_ICONS["out-of-period"],
    );
  });
});
