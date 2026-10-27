import type { AdminWeeklyDigest } from "@/lib/admin-digest/adminWeeklyDigestTypes";

export type DigestSubjectCopy = {
  receipts: (count: number) => string;
  messages: (count: number) => string;
  silent: (count: number) => string;
  parents: (percent: number) => string;
};

export function adminWeeklyDigestSubject(digest: AdminWeeklyDigest, copy: DigestSubjectCopy): string {
  if (digest.pendingReceipts > 0) return copy.receipts(digest.pendingReceipts);
  if (digest.openParentMessages > 0) return copy.messages(digest.openParentMessages);
  if (digest.silentFamilies > 0) return copy.silent(digest.silentFamilies);
  return copy.parents(digest.parentPercent);
}
