import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import type { AdminPortalMessageRow } from "@/types/messaging";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { portalMessageBodyPreviewPlainText } from "@/lib/messaging/portalMessageBodyPreviewPlainText";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import { portalMessageRoleDisplay } from "@/lib/dashboard/portalMessageRoleDisplay";

/** Snippet length for admin inbox cards (`line-clamp-3` shows more than a single line). */
const ADMIN_INBOX_PREVIEW_MAX = 240;

function buildRow(
  m: {
    id: unknown;
    sender_id: unknown;
    recipient_id: unknown;
    body_html: unknown;
    created_at: unknown;
  },
  dict: Dictionary,
  metaById: Map<string, { name: string; role: string }>,
): AdminPortalMessageRow {
  const s = metaById.get(m.sender_id as string);
  const r = metaById.get(m.recipient_id as string);
  return {
    id: m.id as string,
    fromName: s?.name ?? dict.common.emptyValue,
    toName: r?.name ?? dict.common.emptyValue,
    fromRole: portalMessageRoleDisplay(dict, s?.role ?? ""),
    toRole: portalMessageRoleDisplay(dict, r?.role ?? ""),
    createdAt: m.created_at as string,
    preview: portalMessageBodyPreviewPlainText(m.body_html as string, ADMIN_INBOX_PREVIEW_MAX),
  };
}

export type AdminPortalMailboxFilters = {
  /** Messages where this profile is sender or recipient. */
  participantId?: string;
  /** Only rows sent by the synthetic website-contact sender profile. */
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
    .select("id, sender_id, recipient_id, body_html, created_at");

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
  const idList = [...ids];
  const profiles = await chunkedIn<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  }>(supabase, "profiles", "id", idList, "id, first_name, last_name, role");

  const metaById = new Map(
    profiles.map((p) => [
      p.id,
      {
        name: formatProfileSnakeSurnameFirst(p),
        role: p.role as string,
      },
    ]),
  );

  const list = msgs ?? [];

  const inboxRows: AdminPortalMessageRow[] = list
    .filter((m) => {
      if ((m.recipient_id as string) !== adminUserId) return false;
      const sender = metaById.get(m.sender_id as string);
      if (sender?.role === "teacher" || sender?.role === "admin") return true;
      if (sender?.role === "student") return true;
      if (
        sender?.role === "site_contact" &&
        (m.sender_id as string) === PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID
      ) {
        return true;
      }
      return false;
    })
    .map((m) => buildRow(m, dict, metaById));

  const sentRows: AdminPortalMessageRow[] = list
    .filter((m) => (m.sender_id as string) === adminUserId)
    .map((m) => buildRow(m, dict, metaById));

  return { inboxRows, sentRows };
}
