import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  decideShareRequest,
  isOpenShareStatus,
  type EventShareStatus,
} from "@/lib/events/eventShareGrant";
import { logServerError, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

const COLUMNS =
  "id, owner_slug, owner_event_id, guest_slug, status, requested_by, reviewed_by";

const OPEN_STATUSES: EventShareStatus[] = ["pending", "approved", "pending_unshare"];

export type EventShareGrantRecord = {
  id: string;
  ownerSlug: string;
  ownerEventId: string;
  guestSlug: string;
  status: EventShareStatus;
  requestedBy: string;
  reviewedBy: string | null;
};

type GrantTableRow = {
  id: string;
  owner_slug: string;
  owner_event_id: string;
  guest_slug: string;
  status: string;
  requested_by: string;
  reviewed_by: string | null;
};

function mapGrant(row: GrantTableRow): EventShareGrantRecord {
  return {
    id: row.id,
    ownerSlug: row.owner_slug,
    ownerEventId: row.owner_event_id,
    guestSlug: row.guest_slug,
    status: row.status as EventShareStatus,
    requestedBy: row.requested_by,
    reviewedBy: row.reviewed_by,
  };
}

export function eventShareGrantClient(): SupabaseClient {
  return createPulsarAdminClient();
}

export async function listOpenGrantsForGuest(
  client: SupabaseClient,
  guestSlug: string,
): Promise<EventShareGrantRecord[]> {
  const { data, error } = await client
    .from("event_share_grants")
    .select(COLUMNS)
    .eq("guest_slug", guestSlug)
    .in("status", OPEN_STATUSES);
  if (error) {
    logSupabaseClientError("events.share.store", error, { op: "list_guest", guestSlug });
    return [];
  }
  return (data ?? []).map((row) => mapGrant(row as GrantTableRow));
}

export async function listApprovedGrantsForGuest(
  client: SupabaseClient,
  guestSlug: string,
): Promise<EventShareGrantRecord[]> {
  const rows = await listOpenGrantsForGuest(client, guestSlug);
  return rows.filter((row) => row.status === "approved");
}

export async function listGrantsForOwnerEvent(
  client: SupabaseClient,
  ownerSlug: string,
  ownerEventId: string,
): Promise<EventShareGrantRecord[]> {
  const { data, error } = await client
    .from("event_share_grants")
    .select(COLUMNS)
    .eq("owner_slug", ownerSlug)
    .eq("owner_event_id", ownerEventId)
    .order("created_at", { ascending: false });
  if (error) {
    logSupabaseClientError("events.share.store", error, { op: "list_owner", ownerEventId });
    return [];
  }
  return (data ?? []).map((row) => mapGrant(row as GrantTableRow));
}

export async function listPendingGrants(client: SupabaseClient): Promise<EventShareGrantRecord[]> {
  const { data, error } = await client
    .from("event_share_grants")
    .select(COLUMNS)
    .in("status", ["pending", "pending_unshare"])
    .order("created_at", { ascending: true });
  if (error) {
    logSupabaseClientError("events.share.store", error, { op: "list_pending" });
    return [];
  }
  return (data ?? []).map((row) => mapGrant(row as GrantTableRow));
}

export async function insertShareRequest(
  client: SupabaseClient,
  input: {
    ownerSlug: string;
    ownerEventId: string;
    guestSlug: string;
    requestedBy: string;
    enabledSlugs: readonly string[];
  },
): Promise<
  | { ok: true; id: string }
  | { ok: false; code: "share_self" | "share_target_unknown" | "share_already_open" | "share_store_failed" }
> {
  const open = (await listGrantsForOwnerEvent(client, input.ownerSlug, input.ownerEventId)).find(
    (row) => row.guestSlug === input.guestSlug && isOpenShareStatus(row.status),
  );
  const decision = decideShareRequest({
    ownerSlug: input.ownerSlug,
    guestSlug: input.guestSlug,
    enabledSlugs: input.enabledSlugs,
    openStatus: open?.status ?? null,
  });
  if (!decision.ok) return decision;

  const { data, error } = await client
    .from("event_share_grants")
    .insert({
      owner_slug: input.ownerSlug,
      owner_event_id: input.ownerEventId,
      guest_slug: input.guestSlug,
      status: "pending",
      requested_by: input.requestedBy,
    })
    .select("id")
    .single();
  if (error) {
    const unique = (error as { code?: string }).code === "23505";
    const code = unique ? "share_already_open" : "share_store_failed";
    logSupabaseClientError("events.share.store", error, {
      op: "insert",
      ownerEventId: input.ownerEventId,
      guestSlug: input.guestSlug,
      code,
    });
    return { ok: false, code };
  }
  const id = data && typeof data === "object" && "id" in data ? String(data.id) : "";
  if (!id) {
    logServerError("events.share.store", { op: "insert", code: "share_store_failed" });
    return { ok: false, code: "share_store_failed" };
  }
  return { ok: true, id };
}

export async function setGrantStatus(
  client: SupabaseClient,
  input: { id: string; status: EventShareStatus; reviewedBy: string | null },
): Promise<{ ok: true } | { ok: false }> {
  const { error } = await client
    .from("event_share_grants")
    .update({
      status: input.status,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) {
    logSupabaseClientError("events.share.store", error, { op: "set_status", id: input.id });
    return { ok: false };
  }
  return { ok: true };
}

export async function closeGrantsForEvent(
  client: SupabaseClient,
  input: { ownerSlug: string; ownerEventId: string },
): Promise<{ ok: true } | { ok: false }> {
  const { error } = await client
    .from("event_share_grants")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("owner_slug", input.ownerSlug)
    .eq("owner_event_id", input.ownerEventId)
    .in("status", OPEN_STATUSES);
  if (error) {
    logSupabaseClientError("events.share.store", error, {
      op: "close",
      ownerEventId: input.ownerEventId,
    });
    return { ok: false };
  }
  return { ok: true };
}
