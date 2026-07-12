import { describe, expect, it } from "vitest";
import {
  buildCreateSectionModalSteps,
  buildCreateSectionPhaseBStep,
  buildCreateSectionPreModalSteps,
} from "@/lib/admin-tutorials/createSectionTour";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

const COPY = {
  intro: { title: "Intro", description: "d" },
  sectionsTab: { title: "Tab", description: "d" },
  newSection: { title: "New", description: "d" },
  basicsField: { title: "Basics", description: "d" },
  periodField: { title: "Period", description: "d" },
  scheduleField: { title: "Schedule", description: "d" },
  submit: { title: "Submit", description: "d" },
  detail: { title: "Detail", description: "d" },
  missingCohortNotice: { title: "t", description: "d", dismiss: "OK" },
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
};

describe("createSectionTour", () => {
  it("builds pre-modal steps with sections tab and new section gate", () => {
    const steps = buildCreateSectionPreModalSteps(COPY);
    expect(steps).toHaveLength(3);
    expect(steps[1]?.anchor).toBe(ADMIN_TOUR_ANCHORS.cohortSectionsTab);
    expect(steps[1]?.activateCohortSectionsTab).toBe(true);
    expect(steps[2]?.anchor).toBe(ADMIN_TOUR_ANCHORS.newSection);
    expect(steps[2]?.openNewSectionModal).toBe(true);
    expect(steps[2]?.endPreModal).toBe(true);
  });

  it("builds modal steps in form order", () => {
    const steps = buildCreateSectionModalSteps(COPY);
    expect(steps.map((s) => s.anchor)).toEqual([
      ADMIN_TOUR_ANCHORS.newSectionBasics,
      ADMIN_TOUR_ANCHORS.newSectionPeriod,
      ADMIN_TOUR_ANCHORS.newSectionSchedule,
      ADMIN_TOUR_ANCHORS.newSectionSubmit,
    ]);
  });

  it("phase B highlights section detail", () => {
    expect(buildCreateSectionPhaseBStep(COPY).anchor).toBe(ADMIN_TOUR_ANCHORS.sectionDetail);
  });
});
