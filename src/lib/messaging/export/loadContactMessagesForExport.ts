import { logSupabaseClientError, logServerWarn } from "@/lib/logging/serverActionLog";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONTACT_MESSAGE_EXPORT_LATEST_LIMIT,
  CONTACT_MESSAGE_EXPORT_PAGE_SIZE,
  type ContactMessageExportScope,
} from "@/lib/messaging/export/contactMessageExportContract";
import type { ContactMessageExportSource } from "@/lib/messaging/export/parseContactMessageExportRow";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

type RawRow = {
  id?: unknown;
  body_html?: unknown;
  created_at?: unknown;
  broadcast_batch_id?: unknown;
  external_contact_display_name?: unknown;
  external_contact_reply_email?: unknown;
};

export function appendUniqueContactMessageSources(
  state: { seen: Set<string>; rows: ContactMessageExportSource[] },
  page: readonly ContactMessageExportSource[],
  limit: number | null,
): boolean {
  for (const row of page) {
    if (limit !== null && state.rows.length >= limit) return true;
    const key = row.broadcastBatchId?.trim() || row.id;
    if (state.seen.has(key)) continue;
    state.seen.add(key);
    state.rows.push(row);
  }
  return limit !== null && state.rows.length >= limit;
}

function mapRaw(row: RawRow): ContactMessageExportSource {
  return {
    id: String(row.id ?? ""),
    createdAt: String(row.created_at ?? ""),
    broadcastBatchId: row.broadcast_batch_id ? String(row.broadcast_batch_id) : null,
    displayName: row.external_contact_display_name ? String(row.external_contact_display_name) : null,
    replyEmail: row.external_contact_reply_email ? String(row.external_contact_reply_email) : null,
    bodyHtml: String(row.body_html ?? ""),
  };
}

export async function loadContactMessagesForExport(
  supabase: SupabaseClient,
  recipientId: string,
  scope: ContactMessageExportScope,
): Promise<{ ok: true; rows: ContactMessageExportSource[] } | { ok: false }> {
  const state = { seen: new Set<string>(), rows: [] as ContactMessageExportSource[] };
  const limit = scope === "latest_2000" ? CONTACT_MESSAGE_EXPORT_LATEST_LIMIT : null;
  let from = 0;
  let previousFirstId = "";

  for (;;) {
    const { data, error } = await supabase
      .from("portal_messages")
      .select(
        "id, body_html, created_at, broadcast_batch_id, external_contact_display_name, external_contact_reply_email",
      )
      .eq("sender_id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID)
      .eq("recipient_id", recipientId)
      .order("created_at", { ascending: false })
      .range(from, from + CONTACT_MESSAGE_EXPORT_PAGE_SIZE - 1);

    if (error) {
      logSupabaseClientError("loadContactMessagesForExport", error, { scope });
      return { ok: false };
    }

    const page = data ?? [];
    if (page.length === 0) break;
    const firstId = String(page[0]?.id ?? "");
    if (firstId && firstId === previousFirstId) {
      logServerWarn("loadContactMessagesForExport:repeatedPage", { scope, from });
      break;
    }
    previousFirstId = firstId;
    const reached = appendUniqueContactMessageSources(state, page.map(mapRaw), limit);
    if (reached || page.length < CONTACT_MESSAGE_EXPORT_PAGE_SIZE) break;
    from += CONTACT_MESSAGE_EXPORT_PAGE_SIZE;
  }

  return { ok: true, rows: state.rows };
}
