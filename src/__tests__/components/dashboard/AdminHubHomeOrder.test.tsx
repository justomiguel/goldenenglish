// Test group 5 — admin order
// Spec 7, Test 5: In AdminHubHome's output, the payments metric appears
// BEFORE the birthdays card in document order. The birthdays tour anchor
// (data-tour="admin-hub-birthdays") must still be present.
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import { dictEn } from "@/test/dictEn";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";

const SUMMARY: AdminHubSummary = {
  traffic: { totalHits: 120, authenticatedHits: 80, guestHits: 40 },
  trafficDaily: [],
  trafficWeekOverWeek: { thisWeek: 60, lastWeek: 50 },
  users: { total: 42, byRole: [{ role: "student", count: 30 }] },
  payments: { pendingCount: 3 },
  registrations: { newCount: 1, awaitingFeeCount: 2, totalCount: 3 },
  studentsWithoutSection: 0,
  messages: { recentCount: 5, latestPreview: null },
};

describe("AdminHubHome — admin order (Test 5)", () => {
  it("the payments metric card appears before the birthdays card in document order", () => {
    const { container } = render(
      <AdminHubHome
        locale="en"
        dict={dictEn}
        summary={SUMMARY}
        birthdayRows={[]}
        birthdaysDict={dictEn.dashboard.birthdays}
      />,
    );

    const paymentsAnchor = container.querySelector('[data-tour="admin-hub-payments"]');
    const birthdaysAnchor = container.querySelector('[data-tour="admin-hub-birthdays"]');

    expect(paymentsAnchor, "payments anchor must exist").toBeTruthy();
    expect(birthdaysAnchor, "birthdays anchor must exist").toBeTruthy();

    if (!paymentsAnchor || !birthdaysAnchor) return;

    // Node.DOCUMENT_POSITION_FOLLOWING means paymentsAnchor comes BEFORE birthdaysAnchor
    const relation = paymentsAnchor.compareDocumentPosition(birthdaysAnchor);
    const birthdaysIsAfterPayments = !!(relation & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(birthdaysIsAfterPayments, "birthdays must come AFTER payments in DOM").toBe(true);
  });

  it("metric cards use a raised 3d relief", () => {
    const { container } = render(
      <AdminHubHome
        locale="en"
        dict={dictEn}
        summary={SUMMARY}
        birthdayRows={[]}
        birthdaysDict={dictEn.dashboard.birthdays}
      />,
    );
    const traffic = container.querySelector('[data-tour="admin-hub-traffic"]');
    expect(traffic?.className).toContain("inset_0_1px_0");
    expect(traffic?.className).toContain("hover:-translate-y-1");
  });

  it("the birthdays data-tour anchor is still present after reordering", () => {
    const { container } = render(
      <AdminHubHome
        locale="en"
        dict={dictEn}
        summary={SUMMARY}
        birthdayRows={[]}
        birthdaysDict={dictEn.dashboard.birthdays}
      />,
    );
    expect(container.querySelector('[data-tour="admin-hub-birthdays"]')).not.toBeNull();
  });

  it("sizes the birthdays tour anchor to its content so Playwright can see it", () => {
    const { container } = render(
      <AdminHubHome
        locale="en"
        dict={dictEn}
        summary={SUMMARY}
        birthdayRows={[]}
        birthdaysDict={dictEn.dashboard.birthdays}
      />,
    );
    const birthdays = container.querySelector('[data-tour="admin-hub-birthdays"]');
    const tokens = (birthdays?.className ?? "").split(/\s+/);
    expect(tokens).not.toContain("min-h-0");
    expect(tokens).not.toContain("flex-1");
  });

  it("lets hub action cards wrap and grow without clipping their content", () => {
    const { container } = render(
      <AdminHubHome
        locale="en"
        dict={dictEn}
        summary={SUMMARY}
        birthdayRows={[]}
        birthdaysDict={dictEn.dashboard.birthdays}
      />,
    );

    const traffic = container.querySelector('[data-tour="admin-hub-traffic"]');
    const leftCol = traffic?.parentElement;
    const opsGrid = leftCol?.parentElement;
    const metricsRow = leftCol?.querySelector(":scope > .grid");
    const peopleCol = container.querySelector('[data-tour="admin-hub-users"]')?.parentElement;
    const tokens = (el: Element | null | undefined) => (el?.className ?? "").split(/\s+/);

    expect(opsGrid, "ops grid must wrap traffic + people").toBeTruthy();
    expect(tokens(opsGrid)).not.toContain("flex-1");
    expect(tokens(opsGrid)).not.toContain("min-h-0");
    expect(tokens(opsGrid)).not.toContain("lg:min-h-0");
    expect(opsGrid?.className).toContain("lg:flex-1");
    expect(tokens(leftCol)).not.toContain("min-h-0");
    expect(tokens(leftCol)).not.toContain("lg:min-h-0");
    expect(tokens(peopleCol)).not.toContain("min-h-0");
    expect(tokens(peopleCol)).not.toContain("lg:min-h-0");
    expect(tokens(metricsRow)).not.toContain("sm:grid-cols-3");
    expect(tokens(metricsRow)).not.toContain("lg:grid-cols-3");
    expect(metricsRow?.className).toContain("auto-fit");
    expect(metricsRow?.className).toContain("minmax");
    expect(tokens(traffic)).toContain("shrink-0");
  });
});
