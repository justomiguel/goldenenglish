// REGRESSION CHECK: startParentTutorial navigates (incl. ?tab=) then runs the driver tour.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  parentTutorialEntity,
  startParentTutorial,
} from "@/lib/parent-tutorials/client/startParentTutorial";
import type { ParentTutorialId } from "@/lib/parent-tutorials/catalog";
import { PARENT_TOUR_ANALYTICS } from "@/lib/parent-tutorials/analyticsEntities";

const runParentDriverTour = vi.fn();
const waitForSelector = vi.fn();
const trackEvent = vi.fn();
const logClientWarn = vi.fn();

vi.mock("@/lib/parent-tutorials/client/runParentDriverTour", () => ({
  runParentDriverTour: (...args: unknown[]) => runParentDriverTour(...args),
}));

vi.mock("@/lib/admin-tutorials/client/waitForSelector", () => ({
  waitForSelector: (...args: unknown[]) => waitForSelector(...args),
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

vi.mock("@/lib/logging/clientLog", () => ({
  logClientWarn: (...args: unknown[]) => logClientWarn(...args),
}));

function chromeFor(id: ParentTutorialId) {
  return {
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}}/{{total}}",
    steps: {
      intro: { title: `${id} intro`, description: "d" },
      title: { title: "title", description: "d" },
      body: { title: "body", description: "d" },
      list: { title: "list", description: "d" },
      form: { title: "form", description: "d" },
      closing: { title: "closing", description: "d" },
    },
  };
}

function toursDict(ids: ParentTutorialId[]) {
  return Object.fromEntries(ids.map((id) => [id, chromeFor(id)])) as never;
}

describe("startParentTutorial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    waitForSelector.mockResolvedValue(document.createElement("div"));
    runParentDriverTour.mockResolvedValue("complete");
  });

  it("parentTutorialEntity prefixes the tutorial id", () => {
    expect(parentTutorialEntity("parent-badges-overview")).toBe(
      `${PARENT_TOUR_ANALYTICS.tutorialPrefix}parent-badges-overview`,
    );
  });

  it("bails when tour dictionary steps are missing", async () => {
    await startParentTutorial({
      id: "parent-badges-overview",
      locale: "es",
      pathname: "/es/dashboard/parent",
      surface: "desktop",
      toursDict: {} as never,
      push: vi.fn(),
    });
    expect(logClientWarn).toHaveBeenCalledWith(
      "parent.tutorials.task",
      expect.objectContaining({ reason: "missing_tour_dict" }),
    );
    expect(runParentDriverTour).not.toHaveBeenCalled();
  });

  it("navigates to the badges route when standing on a sibling child section", async () => {
    const push = vi.fn();
    await startParentTutorial({
      id: "parent-badges-overview",
      locale: "es",
      pathname: "/es/dashboard/parent/child/tasks",
      surface: "desktop",
      toursDict: toursDict(["parent-badges-overview"]),
      push,
    });
    expect(push).toHaveBeenCalledWith("/es/dashboard/parent/child/badges");
    expect(waitForSelector).toHaveBeenCalled();
    expect(runParentDriverTour).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith(
      "action",
      parentTutorialEntity("parent-badges-overview"),
      expect.objectContaining({ phase: "start" }),
    );
  });

  it("skips navigation when already on the target href", async () => {
    const push = vi.fn();
    await startParentTutorial({
      id: "parent-settings-notifications",
      locale: "es",
      pathname: "/es/dashboard/parent/child/edit",
      surface: "desktop",
      toursDict: toursDict(["parent-settings-notifications"]),
      push,
    });
    expect(push).not.toHaveBeenCalled();
    expect(waitForSelector).not.toHaveBeenCalled();
    expect(runParentDriverTour).toHaveBeenCalled();
  });

  it("warns when the primary anchor times out after navigation", async () => {
    waitForSelector.mockResolvedValue(null);
    const push = vi.fn();
    await startParentTutorial({
      id: "parent-view-child-progress",
      locale: "es",
      pathname: "/es/dashboard/parent",
      surface: "desktop",
      toursDict: toursDict(["parent-view-child-progress"]),
      push,
    });
    expect(push).toHaveBeenCalledWith("/es/dashboard/parent/child");
    expect(logClientWarn).toHaveBeenCalledWith(
      "parent.tutorials.task",
      expect.objectContaining({ reason: "anchor_timeout" }),
    );
  });

  it("warns when the driver reports an error", async () => {
    runParentDriverTour.mockResolvedValue("error");
    await startParentTutorial({
      id: "parent-pay-or-upload-receipt",
      locale: "es",
      pathname: "/es/dashboard/parent/payments",
      surface: "desktop",
      toursDict: toursDict(["parent-pay-or-upload-receipt"]),
      push: vi.fn(),
    });
    expect(logClientWarn).toHaveBeenCalledWith(
      "parent.tutorials.task",
      expect.objectContaining({ reason: "driver_error" }),
    );
  });

  it("uses defaultStudentId for child-detail profile tours", async () => {
    const push = vi.fn();
    await startParentTutorial({
      id: "parent-manage-child-or-tutor-profile",
      locale: "es",
      pathname: "/es/dashboard/parent",
      surface: "desktop",
      toursDict: toursDict(["parent-manage-child-or-tutor-profile"]),
      push,
      defaultStudentId: "stu-1",
    });
    expect(push).toHaveBeenCalledWith("/es/dashboard/parent/child/edit?studentId=stu-1");
  });

  it("fires complete/skip analytics from driver callbacks", async () => {
    runParentDriverTour.mockImplementation(async (opts: {
      onComplete: () => void;
      onSkip: () => void;
    }) => {
      opts.onComplete();
      opts.onSkip();
      return "complete";
    });
    await startParentTutorial({
      id: "parent-calendar-attendance",
      locale: "es",
      pathname: "/es/dashboard/parent/calendar",
      surface: "desktop",
      toursDict: toursDict(["parent-calendar-attendance"]),
      push: vi.fn(),
    });
    expect(trackEvent).toHaveBeenCalledWith(
      "action",
      parentTutorialEntity("parent-calendar-attendance"),
      expect.objectContaining({ phase: "complete" }),
    );
    expect(trackEvent).toHaveBeenCalledWith(
      "action",
      parentTutorialEntity("parent-calendar-attendance"),
      expect.objectContaining({ phase: "skip" }),
    );
  });

  it("covers remaining primary-anchor tutorials via navigation", async () => {
    const ids: ParentTutorialId[] = [
      "parent-read-reply-messages",
      "parent-badges-overview",
    ];
    for (const id of ids) {
      waitForSelector.mockClear();
      const push = vi.fn();
      await startParentTutorial({
        id,
        locale: "es",
        pathname: "/es/dashboard/parent",
        surface: "desktop",
        toursDict: toursDict(ids),
        push,
      });
      expect(push).toHaveBeenCalled();
      expect(waitForSelector).toHaveBeenCalled();
    }
  });
});
