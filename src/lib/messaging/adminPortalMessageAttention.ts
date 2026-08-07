const NEEDS_REPLY_SENDER_ROLES = new Set([
  "student",
  "parent",
  "teacher",
  "site_contact",
]);

export function adminPortalMessageNeedsReply(params: {
  senderRole: string;
  externalRepliedAt: string | null | undefined;
  hasLaterStaffReplyToPeer: boolean;
}): boolean {
  if (!NEEDS_REPLY_SENDER_ROLES.has(params.senderRole)) return false;
  if (params.senderRole === "site_contact") {
    return params.externalRepliedAt == null || params.externalRepliedAt === "";
  }
  return !params.hasLaterStaffReplyToPeer;
}

export type AdminPortalAttentionSortable = {
  id: string;
  createdAt: string;
  isUnread: boolean;
  needsReply: boolean;
};

/** Attention (unread or needs reply) first; within groups, newer first. */
export function sortAdminPortalMailboxAttentionFirst<T extends AdminPortalAttentionSortable>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const aAtt = a.isUnread || a.needsReply ? 1 : 0;
    const bAtt = b.isUnread || b.needsReply ? 1 : 0;
    if (aAtt !== bAtt) return bAtt - aAtt;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
