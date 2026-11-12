import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  HOME_POPUP_EVENT_COLUMNS,
  loadHomeEventPopup,
  rowsToHomePopupEvents,
  type HomeEventPopupEvent,
} from "@/lib/dashboard/events/loadHomeEventPopup";
import { mergeHomePopupEvents } from "@/lib/events/selectHomePopupEvents";
import {
  eventShareGrantClient,
  listApprovedGrantsForGuest,
  type EventShareGrantRecord,
} from "@/lib/events/server/eventShareGrantStore";
import { ownerAdminClient } from "@/lib/events/server/resolveEventDataClient";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

const PAGE = 1000;

async function nonArchivedSlugs(client: SupabaseClient): Promise<Set<string> | null> {
  const slugs = new Set<string>();
  for (let page = 0; ; page += 1) {
    const from = page * PAGE;
    const { data, error } = await client
      .from("events")
      .select("slug")
      .is("archived_at", null)
      .range(from, from + PAGE - 1);
    if (error) {
      await logSupabaseClientError("loadGuestHomeEventPopup:slugs", error);
      return null;
    }
    const batch = data ?? [];
    for (const row of batch) slugs.add(String(row.slug));
    if (batch.length < PAGE) return slugs;
  }
}

async function sharedPopupEvents(
  grants: readonly EventShareGrantRecord[],
  locale: string,
  now: Date,
): Promise<HomeEventPopupEvent[]> {
  const shared: HomeEventPopupEvent[] = [];
  const clients = new Map<string, SupabaseClient | null>();
  for (const grant of grants) {
    if (!clients.has(grant.ownerSlug)) clients.set(grant.ownerSlug, ownerAdminClient(grant.ownerSlug));
    const client = clients.get(grant.ownerSlug);
    if (!client) continue;
    const { data, error } = await client
      .from("events")
      .select(HOME_POPUP_EVENT_COLUMNS)
      .eq("id", grant.ownerEventId)
      .maybeSingle();
    if (error) {
      await logSupabaseClientError("loadGuestHomeEventPopup:owner", error, {
        ownerSlug: grant.ownerSlug,
        eventId: grant.ownerEventId,
      });
      continue;
    }
    if (!data) continue;
    shared.push(...(await rowsToHomePopupEvents(client, [data], locale, now)));
  }
  return shared;
}

/** Local home popup plus approved shared events that are marked for the home. */
export async function loadGuestHomeEventPopup(
  supabase: SupabaseClient,
  locale: string,
  now = new Date(),
): Promise<HomeEventPopupEvent[]> {
  const local = await loadHomeEventPopup(supabase, locale, now);
  try {
    const tenant = await resolveRequestTenant();
    if (!tenant?.slug) return local;
    const grants = await listApprovedGrantsForGuest(eventShareGrantClient(), tenant.slug);
    if (grants.length === 0) return local;
    const taken = await nonArchivedSlugs(supabase);
    if (!taken) return local;
    const shared = await sharedPopupEvents(grants, locale, now);
    return mergeHomePopupEvents({ local, shared, takenSlugs: taken });
  } catch (error) {
    await logServerActionException("loadGuestHomeEventPopup", error);
    return local;
  }
}
