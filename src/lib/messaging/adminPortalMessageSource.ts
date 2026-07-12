import type { AdminPortalMessageRow } from "@/types/messaging";

export type AdminPortalMessageSource = "contact_form" | "internal";

export function adminPortalMessageSource(senderRole: string): AdminPortalMessageSource {
  return senderRole === "site_contact" ? "contact_form" : "internal";
}

export type AdminPortalMailboxCounts = {
  total: number;
  unread: number;
  needsReply: number;
};

export function summarizeAdminPortalMailboxCounts(
  rows: Pick<AdminPortalMessageRow, "isUnread" | "needsReply">[],
): AdminPortalMailboxCounts {
  let unread = 0;
  let needsReply = 0;
  for (const row of rows) {
    if (row.isUnread) unread += 1;
    if (row.needsReply) needsReply += 1;
  }
  return { total: rows.length, unread, needsReply };
}
