"use server";

import { revalidatePath } from "next/cache";
import { openEventWrite } from "@/app/[locale]/dashboard/admin/events/eventWriteClient";
import { adminEventsPath } from "@/app/[locale]/dashboard/admin/events/eventActionsShared";
import { decideUnshareRequest } from "@/lib/events/eventShareGrant";
import { ownerAdminClient } from "@/lib/events/server/resolveEventDataClient";
import {
  eventShareGrantClient,
  insertShareRequest,
  listGrantsForOwnerEvent,
  setGrantStatus,
} from "@/lib/events/server/eventShareGrantStore";
import { logServerError } from "@/lib/logging/serverActionLog";
import { loadAllPulsarTenantsForAdmin } from "@/lib/pulsar/pulsarTenantStore";

export type EventShareActionResult = {
  ok: boolean;
  code?: string;
  notices?: string[];
};

async function guestHasSlug(guestSlug: string, eventSlug: string): Promise<boolean> {
  const client = ownerAdminClient(guestSlug);
  if (!client) return false;
  const { data } = await client
    .from("events")
    .select("id")
    .eq("slug", eventSlug)
    .is("archived_at", null)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function requestEventShareAction(input: {
  locale: string;
  eventId: string;
  guestSlugs: string[];
}): Promise<EventShareActionResult> {
  const opened = await openEventWrite(input.eventId);
  if (!opened.ok) return { ok: false, code: opened.code };
  if (opened.access !== "local") return { ok: false, code: "share_forbidden" };

  const tenants = await loadAllPulsarTenantsForAdmin();
  const enabled = tenants.filter((tenant) => tenant.isEnabled).map((tenant) => tenant.slug);
  const { data: eventRow } = await opened.client
    .from("events")
    .select("slug")
    .eq("id", input.eventId)
    .maybeSingle();
  const eventSlug = eventRow?.slug ? String(eventRow.slug) : "";
  const notices: string[] = [];
  let saved = 0;
  let lastCode = "share_store_failed";

  for (const guestSlug of input.guestSlugs) {
    const inserted = await insertShareRequest(eventShareGrantClient(), {
      ownerSlug: opened.ownerSlug,
      ownerEventId: input.eventId,
      guestSlug,
      requestedBy: opened.actorId,
      enabledSlugs: enabled,
    });
    if (!inserted.ok) {
      lastCode = inserted.code;
      logServerError("events.share.store", {
        op: "request",
        eventId: input.eventId,
        guestSlug,
        code: inserted.code,
      });
      continue;
    }
    saved += 1;
    if (eventSlug && (await guestHasSlug(guestSlug, eventSlug))) notices.push("slug_taken");
  }

  if (saved === 0) return { ok: false, code: lastCode };
  revalidatePath(`${adminEventsPath(input.locale)}/${input.eventId}`, "page");
  return { ok: true, notices };
}

export async function requestEventUnshareAction(input: {
  locale: string;
  eventId: string;
  grantId: string;
}): Promise<EventShareActionResult> {
  const opened = await openEventWrite(input.eventId);
  if (!opened.ok) return { ok: false, code: opened.code };
  if (opened.access !== "local") return { ok: false, code: "share_forbidden" };
  const grants = await listGrantsForOwnerEvent(
    eventShareGrantClient(),
    opened.ownerSlug,
    input.eventId,
  );
  const grant = grants.find((row) => row.id === input.grantId);
  const decision = decideUnshareRequest(grant?.status ?? null);
  if (!decision.ok) return { ok: false, code: decision.code };
  const saved = await setGrantStatus(eventShareGrantClient(), {
    id: input.grantId,
    status: "pending_unshare",
    reviewedBy: null,
  });
  if (!saved.ok) return { ok: false, code: "share_store_failed" };
  revalidatePath(`${adminEventsPath(input.locale)}/${input.eventId}`, "page");
  return { ok: true };
}
