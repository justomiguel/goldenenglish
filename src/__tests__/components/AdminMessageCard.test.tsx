import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminMessageCard } from "@/components/dashboard/AdminMessageCard";
import type { AdminPortalMessageRow } from "@/types/messaging";

vi.mock("@/components/dashboard/DeletePortalMessageButton", () => ({
  DeletePortalMessageButton: () => <button type="button">Delete</button>,
}));

vi.mock("@/components/dashboard/AdminMessageReadToggleButton", () => ({
  AdminMessageReadToggleButton: ({ isUnread }: { isUnread: boolean }) => (
    <button type="button">{isUnread ? "Mark read" : "Mark unread"}</button>
  ),
}));

// REGRESSION CHECK: Unread uses chip + semibold, not a muted full-row wash; toggle is present.

const baseRow: AdminPortalMessageRow = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  fromName: "Parent, Pat",
  toName: "Administration",
  fromRole: "Parents",
  toRole: "Admins",
  createdAt: "2026-07-11T12:00:00.000Z",
  preview: "Short preview text for the list row",
  isUnread: true,
  needsReply: true,
  source: "internal",
};

describe("AdminMessageCard", () => {
  it("renders unread chip and attention bar without relying on muted wash alone", () => {
    render(
      <AdminMessageCard
        locale="en"
        row={baseRow}
        labels={en.admin.messages}
        detailHref="/en/dashboard/admin/messages/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      />,
    );

    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("data-unread", "true");
    expect(article).toHaveAttribute("data-needs-reply", "true");
    expect(article).toHaveAttribute("data-source", "internal");
    expect(screen.getByText(en.admin.messages.badgeUnread)).toBeInTheDocument();
    expect(screen.getByText(en.admin.messages.badgeNeedsReply)).toBeInTheDocument();
    expect(screen.getByText("Short preview text for the list row")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark read" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: new RegExp(en.admin.messages.badgeUnread, "i") }),
    ).toBeInTheDocument();
  });

  it("marks contact form rows with contact_form source and visitor name", () => {
    render(
      <AdminMessageCard
        locale="en"
        row={{
          ...baseRow,
          fromName: "Juan Pérez",
          fromRole: en.admin.messages.roleSiteContact,
          source: "contact_form",
        }}
        labels={en.admin.messages}
        detailHref="/en/dashboard/admin/messages/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      />,
    );

    expect(screen.getByRole("article")).toHaveAttribute("data-source", "contact_form");
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText(en.admin.messages.sourceContactFormAria)).toBeInTheDocument();
  });
});
