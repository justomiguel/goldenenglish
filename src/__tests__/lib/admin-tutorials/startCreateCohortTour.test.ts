// REGRESSION CHECK: use-existing opens cohort and handoffs to create-section tour.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startCreateCohortTour } from "@/lib/admin-tutorials/client/startCreateCohortTour";

const runDriverTour = vi.fn();
const fetchCohortYearContext = vi.fn();
const startCreateSectionTour = vi.fn();
const openNewCohortModalForTutorial = vi.fn();
const isAcademicCohortDetailPath = vi.fn();

vi.mock("@/lib/admin-tutorials/client/runDriverTour", () => ({
  runDriverTour: (...args: unknown[]) => runDriverTour(...args),
}));

vi.mock("@/lib/admin-tutorials/client/fetchCohortYearContext", () => ({
  fetchCohortYearContext: () => fetchCohortYearContext(),
}));

vi.mock("@/lib/admin-tutorials/client/prepareAdminTourStep", () => ({
  openNewCohortModalForTutorial: (...args: unknown[]) => openNewCohortModalForTutorial(...args),
}));

vi.mock("@/lib/admin-tutorials/academicHubPath", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-tutorials/academicHubPath")>();
  return {
    ...actual,
    isAcademicCohortDetailPath: (...args: unknown[]) => isAcademicCohortDetailPath(...args),
  };
});

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: vi.fn(),
}));

const COPY = {
  intro: { title: "Intro", description: "d" },
  navAcademic: { title: "Nav", description: "d" },
  newCohort: { title: "New", description: "d" },
  nameField: { title: "Name", description: "d" },
  submit: { title: "Submit", description: "d" },
  detail: { title: "Detail", description: "d" },
  existingCohortPrompt: {
    title: "t",
    description: "d",
    body: "b",
    useExisting: "Use",
    createNew: "New",
  },
  handoffToCreateSection: {
    title: "Handoff",
    description: "d",
    startSectionTour: "Sections",
    dismiss: "Later",
  },
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
};

describe("startCreateCohortTour existing cohort", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    runDriverTour.mockReset();
    fetchCohortYearContext.mockReset();
    startCreateSectionTour.mockReset();
    openNewCohortModalForTutorial.mockReset();
    isAcademicCohortDetailPath.mockReset();
    isAcademicCohortDetailPath.mockReturnValue(false);
    openNewCohortModalForTutorial.mockResolvedValue(true);
    fetchCohortYearContext.mockResolvedValue({
      year: 2026,
      existing: { id: "cohort-1", name: "Cohort 2026" },
    });
  });

  it("opens cohort detail and offers create-section handoff when staff picks use-existing", async () => {
    runDriverTour.mockResolvedValueOnce("branch-use-existing");
    runDriverTour.mockResolvedValueOnce("handoff-start-section");

    document.body.innerHTML = `<div data-tour="academic-cohort-detail"></div>`;

    const push = vi.fn();
    await startCreateCohortTour({
      locale: "es",
      pathname: "/es/dashboard/admin/academic",
      copy: COPY,
      push,
      startCreateSectionTour,
    });

    expect(runDriverTour).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenCalledWith("/es/dashboard/admin/academic/cohort-1");
    const handoffCall = runDriverTour.mock.calls[1]?.[0] as {
      steps: { handoffCreateSectionTour?: boolean }[];
    };
    expect(handoffCall.steps[0]?.handoffCreateSectionTour).toBe(true);
    expect(startCreateSectionTour).toHaveBeenCalledTimes(1);
  });

  it("continues modal tour when staff picks create-new from in-tour branch", async () => {
    runDriverTour.mockResolvedValueOnce("branch-create-new");
    runDriverTour.mockResolvedValueOnce("skipped");

    const push = vi.fn();
    await startCreateCohortTour({
      locale: "es",
      pathname: "/es/dashboard/admin/academic",
      copy: COPY,
      push,
      phaseBTimeoutMs: 1,
    });

    expect(openNewCohortModalForTutorial).toHaveBeenCalledTimes(1);
    expect(runDriverTour).toHaveBeenCalledTimes(2);
    expect(runDriverTour.mock.calls[1]?.[0]).toMatchObject({
      steps: expect.arrayContaining([
        expect.objectContaining({ anchor: "academic-new-cohort-name" }),
      ]),
    });
    expect(startCreateSectionTour).not.toHaveBeenCalled();
  });

  it("returns after modal tour without awaiting Phase B (launcher must not stay busy)", async () => {
    runDriverTour.mockResolvedValueOnce("branch-create-new");
    runDriverTour.mockResolvedValueOnce("completed");

    const push = vi.fn();
    const started = Date.now();
    await startCreateCohortTour({
      locale: "es",
      pathname: "/es/dashboard/admin/academic",
      copy: COPY,
      push,
      phaseBTimeoutMs: 50,
    });

    expect(Date.now() - started).toBeLessThan(400);
    expect(runDriverTour).toHaveBeenCalledTimes(2);
  });

  it("after create lands on detail, Phase B then handoff can start create-section tour", async () => {
    runDriverTour.mockResolvedValueOnce("branch-create-new");
    runDriverTour.mockResolvedValueOnce("completed"); // modal
    runDriverTour.mockResolvedValueOnce("completed"); // Phase B
    runDriverTour.mockResolvedValueOnce("handoff-start-section");

    isAcademicCohortDetailPath.mockReturnValue(true);
    document.body.innerHTML = `<div data-tour="academic-cohort-detail"></div>`;

    const push = vi.fn();
    await startCreateCohortTour({
      locale: "es",
      pathname: "/es/dashboard/admin/academic/cohort-1",
      copy: COPY,
      push,
      startCreateSectionTour,
      phaseBTimeoutMs: 50,
    });

    // Modal tour returns immediately; Phase B + handoff run detached — flush them.
    await vi.waitFor(() => {
      expect(runDriverTour).toHaveBeenCalledTimes(4);
    });

    const handoffCall = runDriverTour.mock.calls[3]?.[0] as {
      steps: { handoffCreateSectionTour?: boolean }[];
    };
    expect(handoffCall.steps[0]?.handoffCreateSectionTour).toBe(true);
    expect(startCreateSectionTour).toHaveBeenCalledTimes(1);
  });
});
