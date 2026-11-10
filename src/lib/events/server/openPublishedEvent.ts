import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import {
  eventShareGrantClient,
  listApprovedGrantsForGuest,
} from "@/lib/events/server/eventShareGrantStore";
import { ownerAdminClient } from "@/lib/events/server/resolveEventDataClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export type PublishedEventSource = {
  event: PublicEventDetail;
  client: SupabaseClient;
  entryHostSlug: string | null;
};

export async function openPublishedEvent(
  slug: string,
  locale: string,
): Promise<PublishedEventSource | null> {
  const session = await createClient();
  const { data: localRow } = await session
    .from("events")
    .select("id, status")
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();
  if (localRow?.id) {
    if (String(localRow.status) !== "published") return null;
    const client = await createAdminClient();
    const event = await loadEventForPublicLanding(client, slug, locale);
    if (!event) return null;
    return { event, client, entryHostSlug: null };
  }

  const tenant = await resolveRequestTenant();
  if (!tenant?.slug) return null;
  const grants = await listApprovedGrantsForGuest(eventShareGrantClient(), tenant.slug);
  const clients = new Map<string, SupabaseClient | null>();
  for (const grant of grants) {
    if (!clients.has(grant.ownerSlug)) {
      clients.set(grant.ownerSlug, ownerAdminClient(grant.ownerSlug));
    }
    const client = clients.get(grant.ownerSlug);
    if (!client) continue;
    const { data } = await client
      .from("events")
      .select("slug, status, archived_at")
      .eq("id", grant.ownerEventId)
      .maybeSingle();
    if (!data || data.archived_at || String(data.status) !== "published") continue;
    if (String(data.slug) !== slug) continue;
    const event = await loadEventForPublicLanding(client, slug, locale);
    if (event) return { event, client, entryHostSlug: tenant.slug };
  }
  return null;
}
