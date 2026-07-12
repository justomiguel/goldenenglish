// REGRESSION CHECK: Pure inventory helpers underpin rule-33 Vitest contracts.
import { describe, expect, it } from "vitest";
import {
  extractTourAnchorLiterals,
  findMissingDeclaredAnchors,
  findOrphanTourAnchors,
  sourceMentionsAnchor,
} from "@/lib/admin-tutorials/tourAnchorInventory";

describe("tourAnchorInventory helpers", () => {
  it("extracts data-tour, tourAnchor, and tourId literals", () => {
    const src = `
      <div data-tour="academic-new-cohort" />
      <Card tourAnchor="admin-hub-users" />
      { tourId: "admin-nav-academic" }
    `;
    expect(extractTourAnchorLiterals(src)).toEqual([
      "academic-new-cohort",
      "admin-hub-users",
      "admin-nav-academic",
    ]);
  });

  it("finds missing declared anchors and orphans", () => {
    const haystack = `data-tour="a" tourAnchor="b"`;
    expect(sourceMentionsAnchor(haystack, "a")).toBe(true);
    expect(findMissingDeclaredAnchors(["a", "c"], haystack)).toEqual(["c"]);
    expect(findOrphanTourAnchors(new Set(["a"]), haystack)).toEqual(["b"]);
  });

  it("treats ADMIN_TOUR_ANCHORS.key references as present", () => {
    const haystack = `tourId: ADMIN_TOUR_ANCHORS.cohortSectionsTab`;
    const keyByValue = new Map([["academic-cohort-sections-tab", "cohortSectionsTab"]]);
    expect(
      sourceMentionsAnchor(haystack, "academic-cohort-sections-tab", keyByValue),
    ).toBe(true);
  });
});
