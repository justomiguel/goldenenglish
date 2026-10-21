// Test group 5 — admin order
// Spec 7, Test 5: In AdminHubHome's output, the payments metric appears
// BEFORE the birthdays card in document order. The birthdays tour anchor
// (data-tour="admin-hub-birthdays") must still be present.
import { beforeEach, describe, it, expect } from "vitest";
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
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  });

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

    const trafficAnchor = container.querySelector('[data-tour="admin-hub-traffic"]');
    expect(trafficAnchor, "traffic anchor must exist").toBeTruthy();
    if (!trafficAnchor) return;
    const trafficAfterPayments = !!(
      paymentsAnchor.compareDocumentPosition(trafficAnchor) & Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(trafficAfterPayments, "traffic must come AFTER payments in DOM").toBe(true);
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

    const grid = container.querySelector("[data-admin-home-grid]");
    const traffic = container.querySelector('[data-tour="admin-hub-traffic"]');
    const birthdays = container.querySelector('[data-tour="admin-hub-birthdays"]');
    const users = container.querySelector('[data-tour="admin-hub-users"]');
    const tokens = (el: Element | null) => (el?.className ?? "").split(/\s+/);

    expect(grid, "home grid must exist").toBeTruthy();
    expect(grid?.className).toContain("lg:grid-cols-12");
    expect(grid?.className).toContain("lg:flex-1");
    expect(tokens(grid)).not.toContain("min-h-0");
    expect(tokens(traffic)).toContain("shrink-0");
    expect(tokens(birthdays)).not.toContain("min-h-0");
    expect(tokens(users?.parentElement ?? null)).not.toContain("min-h-0");
  });
});
