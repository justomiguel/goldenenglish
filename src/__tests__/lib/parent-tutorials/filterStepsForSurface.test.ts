// REGRESSION CHECK: Surface-tagged steps must not leak desktop chrome into
// mobile tours (and vice versa) or PWA parents see broken Driver anchors.
import { describe, expect, it } from "vitest";
import { filterStepsForSurface } from "@/lib/parent-tutorials/filterStepsForSurface";
import type { ParentTourStepDef } from "@/lib/parent-tutorials/parentTourStepDef";

const steps: ParentTourStepDef[] = [
  { anchor: null, title: "intro", description: "d", surfaces: ["both"] },
  {
    anchor: "parent-sidebar",
    title: "sidebar",
    description: "d",
    surfaces: ["desktop"],
  },
  {
    anchor: "parent-tab-bar",
    title: "tabs",
    description: "d",
    surfaces: ["mobile"],
  },
  {
    anchor: "parent-home-title",
    title: "title",
    description: "d",
    surfaces: ["both"],
  },
];

describe("filterStepsForSurface", () => {
  it("keeps both + desktop on desktop", () => {
    const ids = filterStepsForSurface(steps, "desktop").map((s) => s.title);
    expect(ids).toEqual(["intro", "sidebar", "title"]);
  });

  it("keeps both + mobile on mobile", () => {
    const ids = filterStepsForSurface(steps, "mobile").map((s) => s.title);
    expect(ids).toEqual(["intro", "tabs", "title"]);
  });
});
