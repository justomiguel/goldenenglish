// REGRESSION CHECK: Progress-hub tab tours must navigate when only ?tab= differs.
import { describe, expect, it } from "vitest";
import { parentTutorialNeedsNavigation } from "@/lib/parent-tutorials/client/startParentTutorial";

describe("parentTutorialNeedsNavigation", () => {
  it("stays put when path and required query already match", () => {
    expect(
      parentTutorialNeedsNavigation(
        "/es/dashboard/parent/progress?tab=badges",
        "/es/dashboard/parent/progress?tab=badges",
      ),
    ).toBe(false);
  });

  it("navigates when tab query differs on the same path", () => {
    expect(
      parentTutorialNeedsNavigation(
        "/es/dashboard/parent/progress?tab=tasks",
        "/es/dashboard/parent/progress?tab=badges",
      ),
    ).toBe(true);
  });

  it("navigates when path differs", () => {
    expect(
      parentTutorialNeedsNavigation(
        "/es/dashboard/parent/settings",
        "/es/dashboard/parent/progress?tab=badges",
      ),
    ).toBe(true);
  });
});
