// Test group 2 — the grade reaches the screen
// Spec 7, Test 2: ParentHomeStatusGrid renders the progress pillar card.
// - The last grade text is visible.
// - The card links to /progress.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentHomeStatusGrid } from "@/components/parent/ParentHomeStatusGrid";
import { dictEn } from "@/test/dictEn";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";

const GRADE = {
  score: 18,
  maxScore: 20,
  assessmentName: "Mid-term",
  assessmentOn: "2026-07-15",
};

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
