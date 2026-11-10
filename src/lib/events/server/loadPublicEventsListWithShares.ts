import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPublicEventListRows,
  PUBLIC_EVENT_LIST_COLUMNS,
  type PublicEventListRow,
  type PublicEventsListResult,
} from "@/lib/dashboard/events/loadPublicEventsList";
import {
  eventShareGrantClient,
  listApprovedGrantsForGuest,
} from "@/lib/events/server/eventShareGrantStore";
import { ownerAdminClient } from "@/lib/events/server/resolveEventDataClient";
import { createClient } from "@/lib/supabase/server";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

const PAGE = 1000;

async function walkPublished(client: SupabaseClient): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let page = 0; ; page += 1) {
    const from = page * PAGE;
    const { data } = await client
      .from("events")
      .select(PUBLIC_EVENT_LIST_COLUMNS)
      .eq("status", "published")
      .is("archived_at", null)
      .order("event_date", { ascending: true })
      .range(from, from + PAGE - 1);
    const batch = (data ?? []) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

async function takenSlugs(client: SupabaseClient): Promise<Set<string>> {
  const slugs = new Set<string>();
  for (let page = 0; ; page += 1) {
    const from = page * PAGE;
    const { data } = await client
      .from("events")
      .select("slug")
      .is("archived_at", null)
      .range(from, from + PAGE - 1);
    const batch = data ?? [];
    for (const row of batch) slugs.add(String(row.slug));
    if (batch.length < PAGE) break;
  }
  return slugs;
}

export async function loadPublicEventsListWithShares(
  locale: string,
  page = 1,
  pageSize = 12,
): Promise<PublicEventsListResult> {
  const session = await createClient();
  const localRaw = await walkPublished(session);
  const localRows = await buildPublicEventListRows(session, localRaw, locale);
  const tenant = await resolveRequestTenant();
  const grants = tenant?.slug
    ? await listApprovedGrantsForGuest(eventShareGrantClient(), tenant.slug)
    : [];
  const hidden = grants.length > 0 ? await takenSlugs(session) : new Set<string>();
  const shared: PublicEventListRow[] = [];
  const clients = new Map<string, SupabaseClient | null>();
  for (const grant of grants) {
    if (!clients.has(grant.ownerSlug)) clients.set(grant.ownerSlug, ownerAdminClient(grant.ownerSlug));
    const client = clients.get(grant.ownerSlug);
    if (!client) continue;
    const { data } = await client
      .from("events")
      .select(PUBLIC_EVENT_LIST_COLUMNS)
      .eq("id", grant.ownerEventId)
      .eq("status", "published")
      .is("archived_at", null)
      .maybeSingle();
    if (!data) continue;
    const [row] = await buildPublicEventListRows(client, [data], locale);
    if (!row || hidden.has(row.slug)) continue;
    shared.push(row);
  }
  const merged = [...localRows, ...shared].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  return {
    rows: merged.slice(from, from + pageSize),
    totalCount: merged.length,
    page: safePage,
    pageSize,
  };
}
