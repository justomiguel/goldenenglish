// REGRESSION CHECK: Parent home explain must teach chrome for the active
// surface then content; renaming anchors breaks Help FAB + L2 fixtures.
import { describe, expect, it } from "vitest";
import { buildExplainParentHomeSteps } from "@/lib/parent-tutorials/explainParentHomeTour";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";
import { filterStepsForSurface } from "@/lib/parent-tutorials/filterStepsForSurface";

const copy = {
  intro: { title: "Intro", description: "Welcome" },
  sidebar: { title: "Sidebar", description: "Nav" },
  tabBar: { title: "Tabs", description: "Mobile nav" },
  chromeHeader: { title: "Header", description: "Chrome" },
  chromeProfile: { title: "Account", description: "Account menu" },
  titleBlock: { title: "Home", description: "Title" },
  childSwitcher: { title: "Children", description: "Switcher" },
  statusPillars: { title: "Status", description: "Pillars" },
  inbox: { title: "Inbox", description: "Updates" },
  closing: { title: "Done", description: "Close" },
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
};

describe("buildExplainParentHomeSteps", () => {
  it("includes desktop chrome and shared content", () => {
    const steps = filterStepsForSurface(
      buildExplainParentHomeSteps(copy),
      "desktop",
    );
    const anchors = steps.map((s) => s.anchor);
    expect(anchors[0]).toBeNull();
    expect(anchors).toContain(PARENT_TOUR_ANCHORS.portalTopNav);
    expect(anchors).not.toContain(PARENT_TOUR_ANCHORS.tabBar);
    expect(anchors).toContain(PARENT_TOUR_ANCHORS.homeTitle);
    expect(anchors[anchors.length - 1]).toBeNull();
  });

  it("includes mobile tab bar instead of the top nav", () => {
    const steps = filterStepsForSurface(
      buildExplainParentHomeSteps(copy),
      "mobile",
    );
    const anchors = steps.map((s) => s.anchor);
    expect(anchors).toContain(PARENT_TOUR_ANCHORS.tabBar);
    expect(anchors).not.toContain(PARENT_TOUR_ANCHORS.portalTopNav);
  });

  it("teaches the account menu instead of a standalone sign-out control", () => {
    const anchors = buildExplainParentHomeSteps(copy).map((s) => s.anchor);
    expect(anchors).toContain(PARENT_TOUR_ANCHORS.portalAccount);
    expect(anchors).not.toContain(PARENT_TOUR_ANCHORS.chromeSignOut);
    expect(anchors).not.toContain(PARENT_TOUR_ANCHORS.chromeProfile);
  });
});
