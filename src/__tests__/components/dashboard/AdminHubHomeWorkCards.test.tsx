import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  AdminHubHomeMessagesSlot,
  AdminHubHomePaymentsCard,
  AdminHubHomeRegistrationsCard,
} from "@/components/dashboard/AdminHubHomeWorkCards";
import { dictEn } from "@/test/dictEn";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";

const summary: AdminHubSummary = {
  traffic: { totalHits: 0, authenticatedHits: 0, guestHits: 0 },
  trafficDaily: [],
  trafficWeekOverWeek: { thisWeek: 0, lastWeek: 0 },
  users: { total: 0, byRole: [] },
  payments: { pendingCount: 3 },
  registrations: { newCount: 1, awaitingFeeCount: 2, totalCount: 3 },
  studentsWithoutSection: 0,
  messages: {
    recentCount: 2,
    latestPreview: {
      fromName: "Ana",
      preview: "Can we move the class to Friday afternoon please",
      createdAt: "2026-10-27T12:00:00.000Z",
    },
  },
};

describe("AdminHubHomeWorkCards", () => {
  it("keeps payments, registrations, and messages short", () => {
    const { container } = render(
      <>
        <AdminHubHomePaymentsCard base="/en/dashboard/admin" dict={dictEn} summary={summary} />
        <AdminHubHomeRegistrationsCard base="/en/dashboard/admin" dict={dictEn} summary={summary} />
        <AdminHubHomeMessagesSlot locale="en" base="/en/dashboard/admin" dict={dictEn} summary={summary} />
      </>,
    );

    const home = dictEn.admin.home.summary;
    const actions: Array<[string, string, string]> = [
      ["admin-hub-payments", home.payments.title, home.payments.viewAll],
      ["admin-hub-registrations", home.registrations.title, home.registrations.viewAll],
      ["admin-hub-messages", home.messages.title, home.messages.viewAll],
    ];
    for (const [anchor, title, action] of actions) {
      const card = container.querySelector(`[data-tour="${anchor}"]`);
      expect(card?.className).toContain("items-center");
      expect(card?.className).toContain("p-3");
      expect(card?.className).not.toContain("p-6");
      expect(card?.querySelector(".h-14")).toBeNull();
      const row = within(card as HTMLElement);
      const actionNode = row.getByText(action);
      expect(actionNode.closest("a")).toBe(card);
      expect(row.getByRole("heading", { name: title })).toBeTruthy();
    }

    expect(screen.getByText("3").className).toContain("text-2xl");
    expect(screen.getByText("1").className).toContain("text-2xl");
    expect(screen.getByText("2").className).toContain("text-2xl");
    expect(screen.getByText(summary.messages.latestPreview?.preview ?? "").closest("p")?.className).toContain("truncate");
  });
});
