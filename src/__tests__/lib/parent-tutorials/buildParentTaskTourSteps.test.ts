import { describe, expect, it } from "vitest";
import {
  buildParentTaskTourSteps,
  parentTutorialTargetPath,
  type ParentTaskTourChromeCopy,
} from "@/lib/parent-tutorials/buildParentTaskTourSteps";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

const chrome: ParentTaskTourChromeCopy = {
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
  steps: {
    intro: { title: "Intro", description: "Intro body" },
    title: { title: "Title", description: "Title body" },
    body: { title: "Body", description: "Body copy" },
    feed: { title: "Feed", description: "Feed copy" },
    compose: { title: "Compose", description: "Compose copy" },
    board: { title: "Board", description: "Board copy" },
  },
};

describe("buildParentTaskTourSteps", () => {
  it("maps pay tour to payments anchors with distinct step copy", () => {
    const steps = buildParentTaskTourSteps("parent-pay-or-upload-receipt", chrome);
    expect(steps[0]?.anchor).toBeNull();
    expect(steps[1]).toMatchObject({
      anchor: PARENT_TOUR_ANCHORS.paymentsTitle,
      title: "Title",
    });
    expect(steps[2]).toMatchObject({
      anchor: PARENT_TOUR_ANCHORS.paymentsBody,
      title: "Body",
    });
  });

  it("includes feed and compose for messages tour", () => {
    const steps = buildParentTaskTourSteps("parent-read-reply-messages", chrome);
    expect(steps.map((s) => s.anchor)).toEqual([
      null,
      PARENT_TOUR_ANCHORS.messagesTitle,
      PARENT_TOUR_ANCHORS.messagesFeed,
      PARENT_TOUR_ANCHORS.messagesCompose,
    ]);
  });

  it("resolves target paths under the child route tree", () => {
    expect(parentTutorialTargetPath("parent-calendar-attendance", "es")).toBe(
      "/es/dashboard/parent/child/attendance",
    );
    expect(parentTutorialTargetPath("parent-badges-overview", "es")).toBe(
      "/es/dashboard/parent/child/badges",
    );
    expect(parentTutorialTargetPath("parent-view-child-progress", "es")).toBe(
      "/es/dashboard/parent/child",
    );
  });

  it("badges overview spotlights its own title now that it is a route", () => {
    const steps = buildParentTaskTourSteps("parent-badges-overview", chrome);
    expect(steps.map((s) => s.anchor)).toEqual([
      null,
      PARENT_TOUR_ANCHORS.badgesTitle,
      PARENT_TOUR_ANCHORS.badgesBody,
    ]);
  });

  it("sends the notifications guide to the child form, where the channels live", () => {
    const steps = buildParentTaskTourSteps("parent-settings-notifications", chrome);
    expect(steps.map((s) => s.anchor)).toEqual([
      null,
      PARENT_TOUR_ANCHORS.childDetailTitle,
      PARENT_TOUR_ANCHORS.childDetailBody,
    ]);
    expect(parentTutorialTargetPath("parent-settings-notifications", "es")).toBe(
      "/es/dashboard/parent/child/edit",
    );
  });

  it("routes manage profile task to child detail when student id is known", () => {
    const studentId = "00000000-0000-4000-8000-000000000001";
    const steps = buildParentTaskTourSteps("parent-manage-child-or-tutor-profile", chrome);
    expect(steps.map((s) => s.anchor)).toEqual([
      null,
      PARENT_TOUR_ANCHORS.childDetailTitle,
      PARENT_TOUR_ANCHORS.profileForm,
    ]);
    expect(parentTutorialTargetPath("parent-manage-child-or-tutor-profile", "es", { studentId })).toBe(
      `/es/dashboard/parent/child/edit?studentId=${studentId}`,
    );
  });
});
