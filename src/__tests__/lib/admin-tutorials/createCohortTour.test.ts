// REGRESSION CHECK: createCohort tour step order and branch step drive the Driver runner.
import { describe, expect, it } from "vitest";
import {
  buildCreateCohortHandoffStep,
  buildCreateCohortModalSteps,
  buildCreateCohortPhaseASteps,
  buildCreateCohortPhaseBStep,
  buildCreateCohortPreModalSteps,
  buildExistingCohortBranchStep,
  type CreateCohortTourCopy,
} from "@/lib/admin-tutorials/createCohortTour";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

const COPY: CreateCohortTourCopy = {
  intro: { title: "Intro", description: "Cohort is the container" },
  navAcademic: { title: "Nav", description: "Go academic" },
  newCohort: { title: "New", description: "Open modal" },
  nameField: { title: "Name", description: "Type name" },
  submit: { title: "Submit", description: "Save" },
  detail: { title: "Done", description: "You are on the cohort" },
  existingCohortPrompt: {
    title: "Exists {{year}}",
    description: "Found {{name}}",
    body: "Choose how to proceed",
    useExisting: "Use",
    createNew: "New",
  },
  handoffToCreateSection: {
    title: "Handoff",
    description: "Next: sections",
    startSectionTour: "Start sections",
    dismiss: "Later",
  },
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
};

describe("buildCreateCohortPreModalSteps", () => {
  it("ends at New cohort with existing-cohort gate when no branch context", () => {
    const withNav = buildCreateCohortPreModalSteps(COPY, { includeNavStep: true });
    expect(withNav[0]?.anchor).toBeNull();
    expect(withNav.at(-1)?.anchor).toBe(ADMIN_TOUR_ANCHORS.newCohort);
    expect(withNav.at(-1)?.checkExistingCohortOnNext).toBe(true);
    expect(withNav.at(-1)?.existingCohortBranch).toBeUndefined();
    expect(withNav).toHaveLength(3);
  });

  it("appends in-tour branch step when a year cohort already exists", () => {
    const steps = buildCreateCohortPreModalSteps(
      COPY,
      { includeNavStep: false },
      { year: 2026, existing: { id: "c-1", name: "Cohort 2026" } },
    );
    expect(steps).toHaveLength(3);
    expect(steps[1]?.anchor).toBe(ADMIN_TOUR_ANCHORS.newCohort);
    expect(steps[2]?.existingCohortBranch).toBe(true);
    expect(steps[2]?.title).toContain("2026");
    expect(steps[2]?.description).toContain("Cohort 2026");
  });
});

describe("buildExistingCohortBranchStep", () => {
  it("fills templates for year and cohort name", () => {
    const step = buildExistingCohortBranchStep(COPY, {
      year: 2026,
      existing: { id: "c-1", name: "Alpha" },
    });
    expect(step.existingCohortBranch).toBe(true);
    expect(step.title).toBe("Exists 2026");
    expect(step.description).toContain("Alpha");
    expect(step.description).toContain("Choose how to proceed");
  });
});

describe("buildCreateCohortModalSteps", () => {
  it("opens modal on the name step", () => {
    const steps = buildCreateCohortModalSteps(COPY);
    expect(steps[0]?.anchor).toBe(ADMIN_TOUR_ANCHORS.newCohortName);
    expect(steps[0]?.openNewCohortModal).toBe(true);
    expect(steps[1]?.anchor).toBe(ADMIN_TOUR_ANCHORS.newCohortSubmit);
    expect(steps).toHaveLength(2);
  });
});

describe("buildCreateCohortPhaseASteps", () => {
  it("concatenates pre-modal and modal steps", () => {
    const withNav = buildCreateCohortPhaseASteps(COPY, { includeNavStep: true });
    expect(withNav[0]?.anchor).toBeNull();
    expect(withNav[1]?.anchor).toBe(ADMIN_TOUR_ANCHORS.navAcademic);
    expect(withNav[1]?.navigateToAcademicHub).toBe(true);
    expect(
      withNav.find((s) => s.anchor === ADMIN_TOUR_ANCHORS.newCohort)?.checkExistingCohortOnNext,
    ).toBe(true);
    expect(
      withNav.find((s) => s.anchor === ADMIN_TOUR_ANCHORS.newCohortName)?.openNewCohortModal,
    ).toBe(true);
    expect(withNav).toHaveLength(5);
  });

  it("skips nav when already on academic hub but keeps intro", () => {
    const steps = buildCreateCohortPhaseASteps(COPY, { includeNavStep: false });
    expect(steps[0]?.anchor).toBeNull();
    expect(steps[1]?.anchor).toBe(ADMIN_TOUR_ANCHORS.newCohort);
    expect(steps).toHaveLength(4);
  });
});

describe("buildCreateCohortHandoffStep", () => {
  it("targets cohort detail and offers create-section tutorial", () => {
    const step = buildCreateCohortHandoffStep(COPY);
    expect(step.anchor).toBe(ADMIN_TOUR_ANCHORS.cohortDetail);
    expect(step.handoffCreateSectionTour).toBe(true);
    expect(step.title).toBe("Handoff");
  });
});

describe("buildCreateCohortPhaseBStep", () => {
  it("targets cohort detail shell", () => {
    expect(buildCreateCohortPhaseBStep(COPY).anchor).toBe(ADMIN_TOUR_ANCHORS.cohortDetail);
  });
});
