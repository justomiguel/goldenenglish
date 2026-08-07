// Test group 2 — the grade reaches the screen
// Spec 7, Test 2: ParentHomeStatusGrid renders the progress pillar card.
// - The last grade text is visible.
// - The card links to /progress.
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ParentHomeStatusGrid } from "@/components/parent/ParentHomeStatusGrid";
import { dictEn } from "@/test/dictEn";
import { installMemoryLocalStorage } from "@/__tests__/helpers/installMemoryLocalStorage";
import { progressSeenStorageKey } from "@/lib/parent/progressSeenStorage";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";

const FEEDBACK_ITEM_KEY = "assessment:enr-1:asm-1";

const GRADE = {
  score: 18,
  maxScore: 20,
  assessmentName: "Mid-term",
  assessmentOn: "2026-07-15",
  hasTeacherFeedback: false,
  feedbackItemKey: null,
};

const GRADE_WITH_FEEDBACK = {
  ...GRADE,
  hasTeacherFeedback: true,
  feedbackItemKey: FEEDBACK_ITEM_KEY,
};

beforeEach(() => {
  installMemoryLocalStorage();
});

const PILLARS_WITH_GRADE: ParentHomePillarSnapshot = {
  attendance: { level: "ok", monthPercent: 85 },
  messages: { level: "ok", staffInboundCount: 0 },
  payments: { level: "ok", hasOverdueMonthly: false, overdueInvoiceCount: 0 },
  progress: { level: "ok", lastPublishedGrade: GRADE },
};

const PILLARS_NO_GRADE: ParentHomePillarSnapshot = {
  attendance: { level: "ok", monthPercent: 85 },
  messages: { level: "ok", staffInboundCount: 0 },
  payments: { level: "ok", hasOverdueMonthly: false, overdueInvoiceCount: 0 },
  progress: { level: "unknown", lastPublishedGrade: null },
};

describe("ParentHomeStatusGrid — progress pillar (Test 2: grade reaches screen)", () => {
  it("renders the progress card title", () => {
    const { container } = render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={PILLARS_WITH_GRADE}
        labels={dictEn.dashboard.parent.homeInbox}
      />,
    );
    expect(
      container.textContent?.includes(dictEn.dashboard.parent.homeInbox.pillarProgressTitle),
    ).toBe(true);
  });

  it("progress card links to /progress", () => {
    render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={PILLARS_WITH_GRADE}
        labels={dictEn.dashboard.parent.homeInbox}
      />,
    );
    const links = screen.getAllByRole("link");
    const progressLink = links.find((l) => l.getAttribute("href")?.includes("/progress"));
    expect(progressLink).toBeDefined();
  });

  it("shows grade detail text when grade is present", () => {
    const { container } = render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={PILLARS_WITH_GRADE}
        labels={dictEn.dashboard.parent.homeInbox}
      />,
    );
    // The detail string should contain the assessment name
    expect(container.textContent).toContain("Mid-term");
  });

  it("shows unknown-level label when no grade published yet", () => {
    render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={PILLARS_NO_GRADE}
        labels={dictEn.dashboard.parent.homeInbox}
      />,
    );
    // statusUnknown label from dict should appear for the progress card
    expect(screen.getAllByText(dictEn.dashboard.parent.homeInbox.statusUnknown).length).toBeGreaterThan(0);
  });
});

// REGRESSION CHECK: `hasTeacherFeedback` rides along on the existing grade query, so the
// pillar is the only place families learn a comment exists before opening Progress. Detail
// copy and deep link must stay in sync — promising a comment while linking to the default
// tab sends parents to the wrong place.
describe("ParentHomeStatusGrid — progress pillar advertises teacher feedback", () => {
  const pillarsWithFeedback: ParentHomePillarSnapshot = {
    ...PILLARS_WITH_GRADE,
    progress: { level: "ok", lastPublishedGrade: GRADE_WITH_FEEDBACK },
  };

  function progressLinkHref(pillars: ParentHomePillarSnapshot) {
    render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={pillars}
        labels={dictEn.dashboard.parent.homeInbox}
      />,
    );
    return screen
      .getAllByRole("link")
      .find((link) => link.getAttribute("href")?.includes("/progress"))
      ?.getAttribute("href");
  }

  it("mentions the teacher comment when the latest grade carries one", () => {
    const { container } = render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={pillarsWithFeedback}
        labels={dictEn.dashboard.parent.homeInbox}
      />,
    );
    expect(container.textContent).toContain("teacher comment included");
  });

  it("deep links straight to the feedback tab in that case", () => {
    expect(progressLinkHref(pillarsWithFeedback)).toContain("tab=feedback");
  });

  it("keeps the plain score detail and link when there is no comment", () => {
    const { container } = render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={PILLARS_WITH_GRADE}
        labels={dictEn.dashboard.parent.homeInbox}
      />,
    );
    expect(container.textContent).not.toContain("teacher comment included");
  });

  it("does not deep link to feedback without a comment", () => {
    expect(progressLinkHref(PILLARS_WITH_GRADE)).not.toContain("tab=feedback");
  });
});

// REGRESSION CHECK: the entry-point mark shares the Progress picker's per-device store, so opening
// Feedback has to clear it here. A mark that survives reading is worse than no mark at all.
describe("ParentHomeStatusGrid — progress pillar flags an unread comment", () => {
  const inbox = dictEn.dashboard.parent.homeInbox;

  const pillarsWithFeedback: ParentHomePillarSnapshot = {
    ...PILLARS_WITH_GRADE,
    progress: { level: "ok", lastPublishedGrade: GRADE_WITH_FEEDBACK },
  };

  function renderGrid(pillars: ParentHomePillarSnapshot, studentId: string | null = "stu-1") {
    render(
      <ParentHomeStatusGrid
        locale="en"
        pillars={pillars}
        labels={inbox}
        selectedStudentId={studentId}
      />,
    );
  }

  it("marks a comment this device has not opened yet", async () => {
    renderGrid(pillarsWithFeedback);

    await waitFor(() =>
      expect(screen.getByLabelText(inbox.pillarProgressUnreadAria)).toBeInTheDocument(),
    );
  });

  it("drops the mark once Progress recorded that comment as seen", async () => {
    window.localStorage.setItem(
      progressSeenStorageKey("stu-1"),
      JSON.stringify({ feedback: [FEEDBACK_ITEM_KEY] }),
    );
    renderGrid(pillarsWithFeedback);

    await waitFor(() => expect(screen.getByText("Mid-term", { exact: false })).toBeInTheDocument());
    expect(screen.queryByLabelText(inbox.pillarProgressUnreadAria)).not.toBeInTheDocument();
  });

  it("says nothing when the grade came without a comment", async () => {
    renderGrid(PILLARS_WITH_GRADE);

    await waitFor(() => expect(screen.getByText("Mid-term", { exact: false })).toBeInTheDocument());
    expect(screen.queryByLabelText(inbox.pillarProgressUnreadAria)).not.toBeInTheDocument();
  });

  it("says nothing when no grade is published", async () => {
    renderGrid(PILLARS_NO_GRADE);

    await waitFor(() =>
      expect(screen.getAllByText(inbox.statusUnknown).length).toBeGreaterThan(0),
    );
    expect(screen.queryByLabelText(inbox.pillarProgressUnreadAria)).not.toBeInTheDocument();
  });

  it("keeps one child's reading history from clearing another's mark", async () => {
    window.localStorage.setItem(
      progressSeenStorageKey("stu-1"),
      JSON.stringify({ feedback: [FEEDBACK_ITEM_KEY] }),
    );
    renderGrid(pillarsWithFeedback, "stu-2");

    await waitFor(() =>
      expect(screen.getByLabelText(inbox.pillarProgressUnreadAria)).toBeInTheDocument(),
    );
  });
});
