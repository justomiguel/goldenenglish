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
  trafficWeekOverWeek: { thisWeek: 60, lastWeek: 50 },
  users: { total: 42, byRole: [{ role: "student", count: 30 }] },
  payments: { pendingCount: 3 },
  registrations: { newCount: 1, totalCount: 10 },
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
});
