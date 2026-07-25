import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { portalMessageBodyPreviewPlainText } from "@/lib/messaging/portalMessageBodyPreviewPlainText";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import { portalMessageRoleDisplay } from "@/lib/dashboard/portalMessageRoleDisplay";
import { isAdministrationBoundAdminInbound } from "@/lib/messaging/isAdministrationBoundAdminInbound";
import {
  adminPortalMessageNeedsReply,
  sortAdminPortalMailboxAttentionFirst,
} from "@/lib/messaging/adminPortalMessageAttention";
import { adminPortalMessageSource } from "@/lib/messaging/adminPortalMessageSource";
import { resolveSiteContactVisitorDisplayName } from "@/lib/messaging/siteContactVisitorDisplayName";

/** One-line preview budget for dense admin list rows. */
const ADMIN_INBOX_PREVIEW_MAX = 120;

type MsgRow = {
  id: unknown;
  sender_id: unknown;
  recipient_id: unknown;
  body_html: unknown;
  created_at: unknown;
  broadcast_batch_id?: unknown;
  read_at?: unknown;
  external_replied_at?: unknown;
  external_contact_display_name?: unknown;
  external_contact_reply_email?: unknown;
};

function isAdminInboxSender(
  sender: { role: string } | undefined,
  senderId: string,
): boolean {
  if (!sender) return false;
  if (
    sender.role === "teacher" ||
    sender.role === "admin" ||
    sender.role === "student" ||
    sender.role === "parent"
  ) {
    return true;
  }
  return (
    sender.role === "site_contact" && senderId === PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID
  );
}

function buildLatestStaffReplyByPeer(
  list: MsgRow[],
  metaById: Map<string, { name: string; role: string }>,
): Map<string, number> {
  const latest = new Map<string, number>();
  for (const m of list) {
    const sender = metaById.get(m.sender_id as string);
    if (sender?.role !== "admin") continue;
    const peerId = m.recipient_id as string;
    const t = new Date(m.created_at as string).getTime();
    const prev = latest.get(peerId);
    if (prev == null || t > prev) latest.set(peerId, t);
  }
  return latest;
}

function resolveVisitorContactLabel(m: MsgRow): string | null {
  const visitor = resolveSiteContactVisitorDisplayName({
    external_contact_display_name:
      (m.external_contact_display_name as string | null | undefined) ?? null,
    body_html: (m.body_html as string) ?? "",
  });
  if (visitor) return visitor;
  const email = (m.external_contact_reply_email as string | null | undefined)?.trim();
  return email || null;
}

function resolveFromName(
  m: MsgRow,
  dict: Dictionary,
  metaById: Map<string, { name: string; role: string }>,
): string {
  const s = metaById.get(m.sender_id as string);
  if (s?.role === "site_contact") {
    return resolveVisitorContactLabel(m) ?? s.name ?? dict.common.emptyValue;
  }
  return s?.name ?? dict.common.emptyValue;
}

function resolveToName(
  m: MsgRow,
  dict: Dictionary,
  metaById: Map<string, { name: string; role: string }>,
  adminBound: boolean,
): string {
  if (adminBound) return dict.admin.messages.administrationPeerLabel;
  const recipientId = m.recipient_id as string;
  const r = metaById.get(recipientId);
  if (
    recipientId === PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID ||
    r?.role === "site_contact"
  ) {
    return resolveVisitorContactLabel(m) ?? r?.name ?? dict.common.emptyValue;
  }
  return r?.name ?? dict.common.emptyValue;
}

function buildRow(
  m: MsgRow,
  dict: Dictionary,
  metaById: Map<string, { name: string; role: string }>,
  latestStaffReplyByPeer: Map<string, number>,
): AdminPortalMessageRow {
  const s = metaById.get(m.sender_id as string);
  const r = metaById.get(m.recipient_id as string);
  const adminBound = isAdministrationBoundAdminInbound({
    broadcastBatchId: (m.broadcast_batch_id as string | null | undefined) ?? null,
    senderRole: s?.role ?? "",
  });
  const createdMs = new Date(m.created_at as string).getTime();
  const latestReply = latestStaffReplyByPeer.get(m.sender_id as string);
  const hasLaterStaffReplyToPeer = latestReply != null && latestReply > createdMs;
  const isUnread = m.read_at == null || m.read_at === "";
  const needsReply = adminPortalMessageNeedsReply({
    senderRole: s?.role ?? "",
    externalRepliedAt: (m.external_replied_at as string | null | undefined) ?? null,
    hasLaterStaffReplyToPeer,
  });

  return {
    id: m.id as string,
    fromName: resolveFromName(m, dict, metaById),
    toName: resolveToName(m, dict, metaById, adminBound),
    fromRole: portalMessageRoleDisplay(dict, s?.role ?? ""),
    toRole: portalMessageRoleDisplay(dict, r?.role ?? ""),
    createdAt: m.created_at as string,
    preview: portalMessageBodyPreviewPlainText(m.body_html as string, ADMIN_INBOX_PREVIEW_MAX),
    isUnread,
    needsReply,
    source: adminPortalMessageSource(s?.role ?? ""),
  };
}

export type AdminPortalMailboxFilters = {
  participantId?: string;
  contactFormOnly?: boolean;
};

export type AdminPortalMessagesMailbox = {
  inboxRows: AdminPortalMessageRow[];
  sentRows: AdminPortalMessageRow[];
};

export async function loadAdminPortalMessagesMailbox(
  supabase: SupabaseClient,
  adminUserId: string,
  dict: Dictionary,
  filters?: AdminPortalMailboxFilters | null,
): Promise<AdminPortalMessagesMailbox> {
  let query = supabase
    .from("portal_messages")
    .select(
      "id, sender_id, recipient_id, body_html, created_at, broadcast_batch_id, read_at, external_replied_at, external_contact_display_name, external_contact_reply_email",
    );

  const f = filters ?? {};
  if (f.participantId) {
    query = query.or(`sender_id.eq.${f.participantId},recipient_id.eq.${f.participantId}`);
  }
  if (f.contactFormOnly) {
    query = query.eq("sender_id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID);
  }

  const { data: msgs } = await query.order("created_at", { ascending: false }).limit(500);

  const ids = new Set<string>();
  for (const m of msgs ?? []) {
    ids.add(m.sender_id as string);
    ids.add(m.recipient_id as string);
  }
  const profiles = await chunkedIn<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  }>(supabase, "profiles", "id", [...ids], "id, first_name, last_name, role");

  const metaById = new Map(
    profiles.map((p) => [
      p.id,
      {
        name: formatProfileSnakeSurnameFirst(p),
        role: p.role as string,
      },
    ]),
  );

  const list = (msgs ?? []) as MsgRow[];
  const latestStaffReplyByPeer = buildLatestStaffReplyByPeer(list, metaById);

  const inboxRows = sortAdminPortalMailboxAttentionFirst(
    list
      .filter((m) => {
        if ((m.recipient_id as string) !== adminUserId) return false;
        return isAdminInboxSender(metaById.get(m.sender_id as string), m.sender_id as string);
      })
      .map((m) => buildRow(m, dict, metaById, latestStaffReplyByPeer)),
  );

  const sentRows = list
    .filter((m) => (m.sender_id as string) === adminUserId)
    .map((m) => ({
      ...buildRow(m, dict, metaById, latestStaffReplyByPeer),
      isUnread: false,
      needsReply: false,
    }));

  return { inboxRows, sentRows };
}
