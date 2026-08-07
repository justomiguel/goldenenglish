// REGRESSION CHECK: Reply-with-default must deep-link compose with useDefault=1.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminMessageCard } from "@/components/dashboard/AdminMessageCard";
import type { AdminPortalMessageRow } from "@/types/messaging";

vi.mock("@/components/dashboard/DeletePortalMessageButton", () => ({
  DeletePortalMessageButton: () => <button type="button">Delete</button>,
}));

vi.mock("@/components/dashboard/AdminMessageReadToggleButton", () => ({
  AdminMessageReadToggleButton: () => <button type="button">Mark read</button>,
}));

const baseRow: AdminPortalMessageRow = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  fromName: "Parent, Pat",
  toName: "Administration",
  fromRole: "Parents",
  toRole: "Admins",
  createdAt: "2026-07-11T12:00:00.000Z",
  preview: "Short preview",
  isUnread: false,
  needsReply: true,
  source: "internal",
};

describe("AdminMessageCard reply with default", () => {
  it("links reply-with-default to compose with useDefault=1", () => {
    render(
      <AdminMessageCard
        locale="en"
        row={baseRow}
        labels={en.admin.messages}
        detailHref="/en/dashboard/admin/messages/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      />,
    );

    const link = screen.getByRole("link", { name: en.admin.messages.replyWithDefaultMessage });
    expect(link).toHaveAttribute(
      "href",
      "/en/dashboard/admin/messages/compose?replyTo=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa&useDefault=1",
    );
  });
});
