import { describe, expect, it } from "vitest";
import {
  adminPortalMessageSource,
  summarizeAdminPortalMailboxCounts,
} from "@/lib/messaging/adminPortalMessageSource";
import type { AdminPortalMessageRow } from "@/types/messaging";

describe("adminPortalMessageSource", () => {
  it("marks site_contact as contact_form and others as internal", () => {
    expect(adminPortalMessageSource("site_contact")).toBe("contact_form");
    expect(adminPortalMessageSource("student")).toBe("internal");
    expect(adminPortalMessageSource("parent")).toBe("internal");
    expect(adminPortalMessageSource("admin")).toBe("internal");
  });
});

describe("summarizeAdminPortalMailboxCounts", () => {
  const row = (partial: Partial<AdminPortalMessageRow>): AdminPortalMessageRow => ({
    id: "1",
    fromName: "A",
    toName: "B",
    fromRole: "r",
    toRole: "r",
    createdAt: "2026-07-11T00:00:00.000Z",
    preview: "p",
    isUnread: false,
    needsReply: false,
    source: "internal",
    ...partial,
  });

  it("counts total, unread, and needsReply", () => {
    expect(
      summarizeAdminPortalMailboxCounts([
        row({ isUnread: true, needsReply: true }),
        row({ isUnread: true, needsReply: false }),
        row({ isUnread: false, needsReply: true }),
        row({}),
      ]),
    ).toEqual({ total: 4, unread: 2, needsReply: 2 });
  });
});
