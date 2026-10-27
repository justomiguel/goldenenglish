import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import {
  buildInboxStatusById,
  isAdminMessageFollowUpChannel,
  type AdminMessageFollowUpFact,
  type InboxMessageStatus,
} from "@/lib/messaging/adminMessageStatus";

type FollowUpRow = {
  message_id: string;
  actor_id: string;
  channel: string;
  created_at: string;
};

/** Follow-up opens for the given messages, oldest first. Resolves actor names that are missing. */
export async function loadAdminMessageFollowUpFacts(
  supabase: SupabaseClient,
  messageIds: string[],
  namesById: Map<string, string>,
  emptyName: string,
): Promise<Map<string, AdminMessageFollowUpFact[]>> {
  const rows = await chunkedIn<FollowUpRow>(
    supabase,
    "portal_message_follow_ups",
    "message_id",
    messageIds,
    "message_id, actor_id, channel, created_at",
  );

  const missing = [...new Set(rows.map((row) => row.actor_id))].filter((id) => !namesById.has(id));
  if (missing.length > 0) {
    const extra = await chunkedIn<{ id: string; first_name: string; last_name: string }>(
      supabase,
      "profiles",
      "id",
      missing,
      "id, first_name, last_name",
    );
    for (const profile of extra) {
      namesById.set(profile.id, formatProfileSnakeSurnameFirst(profile));
    }
  }

  const grouped = new Map<string, AdminMessageFollowUpFact[]>();
  const ordered = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const row of ordered) {
    if (!isAdminMessageFollowUpChannel(row.channel)) continue;
    const list = grouped.get(row.message_id) ?? [];
    list.push({
      channel: row.channel,
      actorName: namesById.get(row.actor_id) || emptyName,
      at: row.created_at,
    });
    grouped.set(row.message_id, list);
  }
  return grouped;
}

type InboxSourceRow = {
  id: unknown;
  sender_id: unknown;
  recipient_id: unknown;
  body_html: unknown;
  created_at: unknown;
  read_at?: unknown;
  external_contact_reply_email?: unknown;
};

export async function loadInboxStatusMap(
  supabase: SupabaseClient,
  rows: InboxSourceRow[],
  metaById: Map<string, { name: string; role: string }>,
  inboundIds: ReadonlySet<string>,
  emptyName: string,
): Promise<Map<string, InboxMessageStatus>> {
  const names = new Map([...metaById].map(([id, meta]) => [id, meta.name]));
  const followUps = await loadAdminMessageFollowUpFacts(supabase, [...inboundIds], names, emptyName);
  return buildInboxStatusById(
    rows.map((row) => ({
      id: row.id as string,
      sender_id: row.sender_id as string,
      recipient_id: row.recipient_id as string,
      body_html: String(row.body_html ?? ""),
      created_at: row.created_at as string,
      read_at: (row.read_at as string | null | undefined) ?? null,
      external_contact_reply_email:
        (row.external_contact_reply_email as string | null | undefined) ?? null,
    })),
    metaById,
    followUps,
    inboundIds,
  );
}
