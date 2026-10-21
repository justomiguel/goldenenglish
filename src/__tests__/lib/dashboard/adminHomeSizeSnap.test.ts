import { describe, expect, it } from "vitest";
import { adminHomeSizeFromWidth, stepAdminHomeSize } from "@/lib/dashboard/adminHomeSizeSnap";

describe("adminHomeSizeFromWidth", () => {
  it("snaps a dragged width to the nearest stipulated size", () => {
    expect(adminHomeSizeFromWidth("payments", 400, 1200)).toBe("s");
    expect(adminHomeSizeFromWidth("payments", 700, 1200)).toBe("l");
    expect(adminHomeSizeFromWidth("payments", 1200, 1200)).toBe("full");
  });

  it("keeps traffic at large when the drag is narrower", () => {
    expect(adminHomeSizeFromWidth("traffic", 200, 1200)).toBe("l");
  });

  it("keeps collections at medium when the drag is small", () => {
    expect(adminHomeSizeFromWidth("collections", 100, 1200)).toBe("m");
  });

  it("uses the minimum size when the grid width is unknown", () => {
    expect(adminHomeSizeFromWidth("payments", 400, 0)).toBe("s");
    expect(adminHomeSizeFromWidth("traffic", 400, 0)).toBe("l");
  });
});

describe("stepAdminHomeSize", () => {
  it("steps through stipulated sizes and stops at the ends", () => {
    expect(stepAdminHomeSize("payments", "s", 1)).toBe("m");
    expect(stepAdminHomeSize("payments", "full", 1)).toBe("full");
    expect(stepAdminHomeSize("traffic", "l", -1)).toBe("l");
    expect(stepAdminHomeSize("traffic", "l", 1)).toBe("full");
  });
});
