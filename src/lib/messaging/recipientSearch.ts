import type { MessagingRecipient } from "@/types/messaging";

export function messagingRecipientDisplayName(r: MessagingRecipient): string {
  return `${r.first_name} ${r.last_name}`.trim();
}

export function normalizeMessagingSearchText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function messagingRecipientMatchesQuery(r: MessagingRecipient, rawQuery: string): boolean {
  const q = normalizeMessagingSearchText(rawQuery);
  if (!q) return true;
  const full = normalizeMessagingSearchText(`${r.first_name} ${r.last_name}`);
  const fn = normalizeMessagingSearchText(r.first_name);
  const ln = normalizeMessagingSearchText(r.last_name);
  return full.includes(q) || fn.includes(q) || ln.includes(q);
}

export function filterMessagingRecipientsByQuery(
  recipients: MessagingRecipient[],
  rawQuery: string,
): MessagingRecipient[] {
  const q = rawQuery.trim();
  if (!q) return recipients;
  return recipients.filter((r) => messagingRecipientMatchesQuery(r, rawQuery));
}

/** Order of groups in recipient pickers (admin may include parents/guardians). */
const ROLE_PRIORITY = ["student", "parent", "teacher", "admin"] as const;

function sortByName(a: MessagingRecipient, b: MessagingRecipient): number {
  const ln = a.last_name.localeCompare(b.last_name, undefined, { sensitivity: "base" });
  if (ln !== 0) return ln;
  return a.first_name.localeCompare(b.first_name, undefined, { sensitivity: "base" });
}

export type RecipientRoleGroup = {
  role: string;
  label: string;
  items: MessagingRecipient[];
};

export function groupMessagingRecipientsForPicker(
  recipients: MessagingRecipient[],
  roleLabels: Record<string, string>,
): RecipientRoleGroup[] {
  const byRole = new Map<string, MessagingRecipient[]>();
  for (const r of recipients) {
    const list = byRole.get(r.role) ?? [];
    list.push(r);
    byRole.set(r.role, list);
  }
  const out: RecipientRoleGroup[] = [];
  const seen = new Set<string>();
  for (const role of ROLE_PRIORITY) {
    const items = byRole.get(role);
    if (items?.length) {
      seen.add(role);
      out.push({
        role,
        label: roleLabels[role] ?? role,
        items: [...items].sort(sortByName),
      });
    }
  }
  for (const [role, items] of byRole) {
    if (!seen.has(role) && items.length) {
      out.push({
        role,
        label: roleLabels[role] ?? role,
        items: [...items].sort(sortByName),
      });
    }
  }
  return out;
}
