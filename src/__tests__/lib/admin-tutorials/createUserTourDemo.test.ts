import { describe, expect, it, vi, afterEach } from "vitest";
import {
  demoBirthIsoForTourPath,
  isoYmdYearsAgo,
} from "@/lib/admin-tutorials/createUserTourDemo";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import {
  ADMIN_TOUR_ANCHORS,
  ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT,
} from "@/lib/admin-tutorials/selectors";
import { dispatchCreateUserTourDemo } from "@/lib/admin-tutorials/client/dispatchCreateUserTourDemo";

describe("createUserTourDemo", () => {
  it("isoYmdYearsAgo returns YYYY-MM-DD", () => {
    expect(isoYmdYearsAgo(10, new Date(2026, 6, 11))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("minor path birth is under legal majority", () => {
    const from = new Date(2026, 6, 11);
    const iso = demoBirthIsoForTourPath("minor", 18, from);
    expect(fullYearsFromIsoDate(iso, from)).toBeLessThan(18);
  });

  it("adult path birth is at or above legal majority", () => {
    const from = new Date(2026, 6, 11);
    const iso = demoBirthIsoForTourPath("adult", 18, from);
    expect(fullYearsFromIsoDate(iso, from)).toBeGreaterThanOrEqual(18);
  });
});

describe("filterTourStepsForDom", () => {
  it("keeps required steps and drops missing optional anchors", () => {
    const steps: AdminTourStepDef[] = [
      { title: "a", description: "d", anchor: ADMIN_TOUR_ANCHORS.navUsers, optional: true },
      { title: "b", description: "d", anchor: ADMIN_TOUR_ANCHORS.createUserForm },
    ];
    const filtered = filterTourStepsForDom(steps, () => null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.anchor).toBe(ADMIN_TOUR_ANCHORS.createUserForm);
  });
});

describe("dispatchCreateUserTourDemo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches apply-create-user-demo with detail", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    dispatchCreateUserTourDemo({ role: "student", birthPath: "minor" });
    expect(spy).toHaveBeenCalled();
    const evt = spy.mock.calls[0]?.[0] as CustomEvent;
    expect(evt.type).toBe(ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT);
    expect(evt.detail).toEqual({ role: "student", birthPath: "minor" });
  });
});
