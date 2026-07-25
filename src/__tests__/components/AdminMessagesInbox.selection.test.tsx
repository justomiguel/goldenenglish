import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminMessagesInbox } from "@/components/dashboard/AdminMessagesInbox";
import type { AdminPortalMessageRow } from "@/types/messaging";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/messages",
}));

vi.mock("@/app/[locale]/dashboard/admin/messages/readStateActions", () => ({
  setAdminPortalMessageReadState: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/messages/actions", () => ({
  deleteAdminPortalMessage: vi.fn(),
}));

const labels = {
  empty: "No messages",
  detailOpenMessageTitle: "Open",
  detailEmptyBody: "Empty",
  preview: "Preview",
  badgeUnread: "Unread",
  badgeNeedsReply: "Needs reply",
  sourceContactFormAria: "Contact form",
  sourceInternalAria: "Internal",
  replyToMessage: "Reply",
  replyToMessageTitle: "Reply title",
  replyWithDefaultMessage: "Reply with default",
  replyWithDefaultMessageTitle: "Reply with default title",
  deletePortalMessageTitle: "Delete title",
  deletePortalMessageAction: "Delete",
  deletePortalMessageConfirmTitle: "Confirm?",
  deletePortalMessageConfirmDescription: "Desc",
  deletePortalMessageConfirm: "Confirm",
  deletePortalMessageCancel: "Cancel",
  deletePortalMessageError: "Err",
  deletePortalMessageNotFound: "Missing",
  markAsRead: "Mark as read",
  markAsReadTitle: "Mark read",
  markAsUnread: "Mark as unread",
  markAsUnreadTitle: "Mark unread",
  bulkSelectRowAria: "Select message from {{from}}",
} as never;

const row: AdminPortalMessageRow = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  fromName: "Ada Lovelace",
  toName: "Admin",
  fromRole: "student",
  toRole: "admin",
  createdAt: "2026-07-01T12:00:00.000Z",
  preview: "Hello",
  isUnread: true,
  needsReply: false,
  source: "internal",
};

describe("AdminMessagesInbox selection", () => {
  it("toggles row selection via checkbox", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <AdminMessagesInbox
        locale="en"
        labels={labels}
        rows={[row]}
        listTopMargin={false}
        selectedIds={new Set()}
        onToggleSelected={onToggle}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Select message from Ada Lovelace" }));
    expect(onToggle).toHaveBeenCalledWith(row.id);
  });
});
