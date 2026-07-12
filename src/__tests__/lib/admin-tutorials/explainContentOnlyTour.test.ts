// REGRESSION CHECK: Content-only explain builders must stay aligned with screenTourDefs.
import { describe, expect, it } from "vitest";
import { buildContentOnlyExplainSteps } from "@/lib/admin-tutorials/explainContentOnlyTour";
import {
  CONTENT_ONLY_SCREEN_TOUR_DEFS,
  getContentOnlyScreenTourDefs,
} from "@/lib/admin-tutorials/screenTourDefs";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

function stubSteps(defs: readonly { key: string }[]) {
  return Object.fromEntries(
    defs.map((d) => [d.key, { title: `${d.key}-t`, description: `${d.key}-d` }]),
  );
}

describe("explainContentOnlyTour / screenTourDefs", () => {
  it("builds users steps in order with content-only anchors", () => {
    const defs = getContentOnlyScreenTourDefs("admin-users");
    const steps = buildContentOnlyExplainSteps(stubSteps(defs), defs);
    expect(steps[0]).toMatchObject({ anchor: null, title: "intro-t" });
    expect(steps.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.usersTitle)).toBe(true);
    expect(steps.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.sidebar)).toBe(false);
    expect(steps.at(-1)?.anchor).toBeNull();
  });

  it("marks finance cohortYear optional", () => {
    const defs = getContentOnlyScreenTourDefs("admin-finance");
    const cohort = defs.find((d) => d.key === "cohortYear");
    expect(cohort?.optional).toBe(true);
    const steps = buildContentOnlyExplainSteps(stubSteps(defs), defs);
    expect(steps.find((s) => s.anchor === ADMIN_TOUR_ANCHORS.financeCohortYear)?.optional).toBe(
      true,
    );
  });

  it("registers defs for every content-only screen id", () => {
    const ids = Object.keys(CONTENT_ONLY_SCREEN_TOUR_DEFS);
    expect(ids.length).toBeGreaterThanOrEqual(20);
    for (const id of ids) {
      const defs = CONTENT_ONLY_SCREEN_TOUR_DEFS[id as keyof typeof CONTENT_ONLY_SCREEN_TOUR_DEFS];
      expect(defs[0]?.key).toBe("intro");
      expect(defs.at(-1)?.key).toBe("closing");
      expect(() => buildContentOnlyExplainSteps(stubSteps(defs), defs)).not.toThrow();
    }
  });
});
