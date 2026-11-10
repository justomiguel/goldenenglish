import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminEventActor } from "@/app/[locale]/dashboard/admin/events/eventActionsShared";
import { enterEventWriteAudit } from "@/lib/events/server/eventWriteAuditContext";
import {
  eventShareGrantClient,
  listApprovedGrantsForGuest,
} from "@/lib/events/server/eventShareGrantStore";
import {
  ownerAdminClient,
  resolveEventDataClient,
} from "@/lib/events/server/resolveEventDataClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

const ROW_TABLES = ["event_attendees", "event_form_fields", "event_ticket_packages"] as const;

export type EventWriteRowTable = (typeof ROW_TABLES)[number];

export type EventWriteClient =
  | {
      ok: true;
      client: SupabaseClient;
      actorId: string;
      access: "local" | "guest";
      ownerSlug: string;
    }
  | { ok: false; code: "forbidden" | "share_not_approved" };

export async function openEventWrite(eventId: string): Promise<EventWriteClient> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const resolved = await resolveEventDataClient(eventId);
  if (!resolved.ok) return { ok: false, code: resolved.code };
  if (resolved.access === "guest") {
    const tenant = await resolveRequestTenant();
    enterEventWriteAudit({
      client: resolved.client,
      guestSlug: tenant?.slug ?? "",
      guestActorId: actorId,
    });
  }
  return {
    ok: true,
    client: resolved.client,
    actorId,
    access: resolved.access,
    ownerSlug: resolved.ownerSlug,
  };
}

export async function openEventWriteByRow(
  table: EventWriteRowTable,
  rowId: string,
): Promise<EventWriteClient> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, code: "forbidden" };
  const eventId = await eventIdOnRow(table, rowId);
  if (!eventId) return { ok: false, code: "share_not_approved" };
  return openEventWrite(eventId);
}

async function eventIdOnRow(table: EventWriteRowTable, rowId: string): Promise<string | null> {
  const current = await createAdminClient();
  const local = await current.from(table).select("event_id").eq("id", rowId).maybeSingle();
  const localId = local.data?.event_id ? String(local.data.event_id) : "";
  if (localId) return localId;
  const tenant = await resolveRequestTenant();
  if (!tenant?.slug) return null;
  const grants = await listApprovedGrantsForGuest(eventShareGrantClient(), tenant.slug);
  for (const grant of grants) {
    const client = ownerAdminClient(grant.ownerSlug);
    if (!client) continue;
    const found = await client
      .from(table)
      .select("event_id")
      .eq("id", rowId)
      .eq("event_id", grant.ownerEventId)
      .maybeSingle();
    if (found.data?.event_id) return String(found.data.event_id);
  }
  return null;
}
