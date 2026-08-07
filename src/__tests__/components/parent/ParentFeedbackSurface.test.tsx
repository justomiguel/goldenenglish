import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { ParentFeedbackItem, ParentFeedbackTimeline } from "@/types/parentFeedback";

// REGRESSION CHECK: the whole point of this surface is that families can READ the teacher's
// words. Any change that renders scores/titles but drops `item.feedback` from the DOM —
// on either surface — reintroduces the bug this feature was built to fix.

const mockUseAppSurface = vi.fn<() => AppSurface>();

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

import { ParentFeedbackSurface } from "@/components/parent/ParentFeedbackSurface";

const copy = dictEn.dashboard.parent.feedback;

const EXAM_FEEDBACK = "Zara reads with real confidence now; keep drilling past tenses.";
const MINI_TEST_FEEDBACK = "Listening is steady, vocabulary needs a little more practice.";

function item(overrides: Partial<ParentFeedbackItem> = {}): ParentFeedbackItem {
  return {
    id: "assessment:enr-1:asm-1",
    source: "assessment",
    studentId: "stu-1",
    childLabel: "Adams Zara",
    title: "Unit 3 exam",
    contextLabel: "B1 — Group A",
    teacherName: "Ruiz Marta",
    occurredOn: "2026-08-05",
    score: 82,
    maxScore: 100,
    feedback: EXAM_FEEDBACK,
    isNew: true,
    ...overrides,
  };
}

const TIMELINE: ParentFeedbackTimeline = {
  items: [
    item(),
    item({
      id: "learning:att-1",
      source: "learning",
      title: "Listening check",
      occurredOn: "2026-06-02",
      score: null,
      maxScore: null,
      feedback: MINI_TEST_FEEDBACK,
      isNew: false,
    }),
  ],
  newCount: 1,
};

async function renderSurface(surface: AppSurface, timeline = TIMELINE) {
  mockUseAppSurface.mockReturnValue(surface);
  render(<ParentFeedbackSurface locale="en" timeline={timeline} copy={copy} />);
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ParentFeedbackSurface — desktop", () => {
  it("shows the full teacher text for every entry", async () => {
    await renderSurface("web-desktop");

    expect(screen.getByText(EXAM_FEEDBACK)).toBeInTheDocument();
    expect(screen.getByText(MINI_TEST_FEEDBACK)).toBeInTheDocument();
  });

  it("gives each entry its assessment, section, teacher, and date context", async () => {
    await renderSurface("web-desktop");

    expect(screen.getByText("Unit 3 exam")).toBeInTheDocument();
    expect(screen.getByText("B1 — Group A · By Ruiz Marta · Aug 5, 2026")).toBeInTheDocument();
  });

  it("summarises how many comments are new", async () => {
    await renderSurface("web-desktop");

    expect(screen.getByText("1 new comment in the last 14 days")).toBeInTheDocument();
  });

  it("labels the score for screen readers", async () => {
    await renderSurface("web-desktop");

    expect(screen.getByLabelText("Score 82 out of 100")).toHaveTextContent("82 / 100");
  });

  it("explains the empty state instead of showing a bare list", async () => {
    await renderSurface("web-desktop", { items: [], newCount: 0 });

    expect(screen.getByText(copy.empty)).toBeInTheDocument();
    expect(screen.getByText(copy.emptyHint)).toBeInTheDocument();
  });
});

describe("ParentFeedbackSurface — installed app", () => {
  it("opens the newest entry so the latest comment needs no tap", async () => {
    await renderSurface("pwa-mobile");

    expect(screen.getAllByText(EXAM_FEEDBACK).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: copy.collapse })).toBeInTheDocument();
  });

  it("reveals an older comment when its row is tapped", async () => {
    const user = userEvent.setup();
    await renderSurface("pwa-mobile");

    const collapsedRow = screen.getByRole("button", { name: copy.expand });
    const panelId = collapsedRow.getAttribute("aria-controls") ?? "";
    expect(document.getElementById(panelId)).not.toBeVisible();

    await user.click(collapsedRow);

    expect(collapsedRow).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(panelId)).toHaveTextContent(MINI_TEST_FEEDBACK);
    expect(document.getElementById(panelId)).toBeVisible();
  });

  it("keeps rows reachable as accessible disclosure controls", async () => {
    await renderSurface("pwa-mobile");

    const collapsed = screen.getAllByRole("button", { name: copy.expand })[0];
    expect(collapsed).toHaveAttribute("aria-expanded", "false");
    expect(collapsed).toHaveAttribute("aria-controls");
  });

  it("shows the same empty guidance as the desktop tree", async () => {
    await renderSurface("pwa-mobile", { items: [], newCount: 0 });

    expect(screen.getByText(copy.empty)).toBeInTheDocument();
    expect(screen.getByText(copy.emptyHint)).toBeInTheDocument();
  });
});
