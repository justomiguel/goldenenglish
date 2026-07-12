import { describe, expect, it } from "vitest";
import {
  adminPortalMessageNeedsReply,
  sortAdminPortalMailboxAttentionFirst,
} from "@/lib/messaging/adminPortalMessageAttention";

// REGRESSION CHECK: Admin↔admin DMs must not show needsReply; site_contact uses external_replied_at.

describe("adminPortalMessageNeedsReply", () => {
  it("returns false for admin senders", () => {
    expect(
      adminPortalMessageNeedsReply({
        senderRole: "admin",
        externalRepliedAt: null,
        hasLaterStaffReplyToPeer: false,
      }),
    ).toBe(false);
  });

  it("uses external_replied_at for site_contact", () => {
    expect(
      adminPortalMessageNeedsReply({
        senderRole: "site_contact",
        externalRepliedAt: null,
        hasLaterStaffReplyToPeer: false,
      }),
    ).toBe(true);
    expect(
      adminPortalMessageNeedsReply({
        senderRole: "site_contact",
        externalRepliedAt: "2026-07-11T12:00:00.000Z",
        hasLaterStaffReplyToPeer: false,
      }),
    ).toBe(false);
  });

  it("uses later staff reply for portal peers", () => {
    expect(
      adminPortalMessageNeedsReply({
        senderRole: "parent",
        externalRepliedAt: null,
        hasLaterStaffReplyToPeer: false,
      }),
    ).toBe(true);
    expect(
      adminPortalMessageNeedsReply({
        senderRole: "student",
        externalRepliedAt: null,
        hasLaterStaffReplyToPeer: true,
      }),
    ).toBe(false);
  });
});

describe("sortAdminPortalMailboxAttentionFirst", () => {
  it("puts unread or needsReply before handled, then by date desc", () => {
    const rows = [
      {
        id: "old-attention",
        createdAt: "2026-07-01T10:00:00.000Z",
        isUnread: true,
        needsReply: false,
      },
      {
        id: "new-handled",
        createdAt: "2026-07-11T10:00:00.000Z",
        isUnread: false,
        needsReply: false,
      },
      {
        id: "mid-needs",
        createdAt: "2026-07-05T10:00:00.000Z",
        isUnread: false,
        needsReply: true,
      },
    ];
    const sorted = sortAdminPortalMailboxAttentionFirst(rows);
    expect(sorted.map((r) => r.id)).toEqual(["mid-needs", "old-attention", "new-handled"]);
  });
});
