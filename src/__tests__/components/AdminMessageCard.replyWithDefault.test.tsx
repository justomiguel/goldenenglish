import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminMessageCard } from "@/components/dashboard/AdminMessageCard";
import type { AdminPortalMessageRow } from "@/types/messaging";

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
  it("keeps reply actions off the list row", () => {
    render(
      <AdminMessageCard
        locale="en"
        row={baseRow}
        labels={en.admin.messages}
        detailHref="/en/dashboard/admin/messages/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      />,
    );

    expect(screen.queryByRole("link", { name: en.admin.messages.replyWithDefaultMessage })).toBeNull();
    expect(screen.getByRole("link", { name: /Short preview/ })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/messages/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });
});
