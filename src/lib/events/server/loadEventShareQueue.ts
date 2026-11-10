import "server-only";

import { eventShareGrantClient, listPendingGrants } from "@/lib/events/server/eventShareGrantStore";
import { ownerAdminClient } from "@/lib/events/server/resolveEventDataClient";
import { logServerError } from "@/lib/logging/serverActionLog";
import { loadAllPulsarTenantsForAdmin } from "@/lib/pulsar/pulsarTenantStore";

export type EventShareQueueRow = {
  grantId: string;
  ownerName: string;
  guestName: string;
  eventId: string;
  eventTitle: string;
  titleCode: string | null;
  kind: "share" | "unshare";
};

export async function loadEventShareQueue(): Promise<EventShareQueueRow[]> {
  const grants = await listPendingGrants(eventShareGrantClient());
  const tenants = await loadAllPulsarTenantsForAdmin();
  const siteName = (slug: string) => tenants.find((tenant) => tenant.slug === slug)?.displayName ?? slug;
  const rows: EventShareQueueRow[] = [];
  for (const grant of grants) {
    const client = ownerAdminClient(grant.ownerSlug);
    let eventTitle = grant.ownerEventId;
    let titleCode: string | null = "event_title_unavailable";
    if (client) {
      const { data, error } = await client
        .from("events")
        .select("title")
        .eq("id", grant.ownerEventId)
        .maybeSingle();
      if (!error && data?.title) {
        eventTitle = String(data.title);
        titleCode = null;
      } else {
        logServerError("events.share.resolve", {
          op: "queue_title",
          eventId: grant.ownerEventId,
          code: "event_title_unavailable",
        });
      }
    }
    rows.push({
      grantId: grant.id,
      ownerName: siteName(grant.ownerSlug),
      guestName: siteName(grant.guestSlug),
      eventId: grant.ownerEventId,
      eventTitle,
      titleCode,
      kind: grant.status === "pending_unshare" ? "unshare" : "share",
    });
  }
  return rows;
}
