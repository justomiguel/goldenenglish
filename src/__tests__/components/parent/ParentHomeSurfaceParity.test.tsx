// Test group 3 — surface parity
// Spec 7, Test 3: Both ParentHomeInbox (desktop) and ParentHomePwaFocus (mobile/PWA)
// must show the news feed. This keeps F12 closed: same information on both surfaces.
// Asserting on information (news item title), not on markup.
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ParentHomeInbox } from "@/components/parent/ParentHomeInbox";
import { ParentHomePwaFocus } from "@/components/parent/ParentHomePwaFocus";
import { dictEn } from "@/test/dictEn";
import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import type { ParentHomeNewsItem } from "@/lib/parent/loadParentHomeNewsFeed";

const SUMMARY: ParentChildSummary = {
  studentId: "s1",
  firstName: "Alex",
  lastName: "Smith",
  attendancePercent: 80,
  levelLabel: "B2",
  nextExamAt: null,
  nextEventAt: null,
  nextEventLabel: null,
  assignedTeacherId: null,
  assignedTeacherName: null,
  lastPublishedGrade: null,
};

const PILLARS: ParentHomePillarSnapshot = {
  attendance: { level: "ok", monthPercent: 80 },
  messages: { level: "ok", staffInboundCount: 0 },
  payments: { level: "ok", hasOverdueMonthly: false, overdueInvoiceCount: 0 },
  progress: { level: "unknown", lastPublishedGrade: null },
};

const NEWS_ITEMS: ParentHomeNewsItem[] = [
  {
    kind: "blog",
    id: "n1",
    title: "Exclusive article for surface parity test",
    href: "/en/blog/exclusive-article",
    sortAt: "2026-08-01T00:00:00Z",
    dateLabel: "Aug 1",
  },
];

const SHARED_PROPS = {
  locale: "en",
  greeting: "Hello",
  firstName: "Alex",
  summaries: [SUMMARY],
  selectedStudentId: "s1",
  pillars: PILLARS,
  attendanceByStudent: { s1: 80 },
  overdueByStudent: { s1: false },
  labels: dictEn.dashboard.parent,
  newsItems: NEWS_ITEMS,
};

describe("Surface parity — news feed on desktop and mobile (Test 3)", () => {
  it("desktop surface (ParentHomeInbox) renders the news feed item", () => {
    const { container } = render(
      <ParentHomeInbox
        {...SHARED_PROPS}
        fullDateLine="Friday, August 7, 2026"
      />,
    );
    expect(container.textContent).toContain("Exclusive article for surface parity test");
  });

  it("mobile/PWA surface (ParentHomePwaFocus) renders the news feed item", () => {
    const { container } = render(
      <ParentHomePwaFocus {...SHARED_PROPS} />,
    );
    expect(container.textContent).toContain("Exclusive article for surface parity test");
  });

  it("both surfaces render news feed title label", () => {
    const { container: desktopContainer } = render(
      <ParentHomeInbox
        {...SHARED_PROPS}
        fullDateLine="Friday, August 7, 2026"
      />,
    );
    const { container: mobileContainer } = render(
      <ParentHomePwaFocus {...SHARED_PROPS} />,
    );
    const feedTitle = dictEn.dashboard.parent.homeInbox.newsFeed.title;
    expect(desktopContainer.textContent).toContain(feedTitle);
    expect(mobileContainer.textContent).toContain(feedTitle);
  });
});
