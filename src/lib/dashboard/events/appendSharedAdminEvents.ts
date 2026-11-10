import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminEventRow, PaginatedAdminEventsResult } from "@/lib/dashboard/events/loadPaginatedAdminEvents";
import {
  eventShareGrantClient,
  listApprovedGrantsForGuest,
} from "@/lib/events/server/eventShareGrantStore";
import { ownerAdminClient } from "@/lib/events/server/resolveEventDataClient";
import { loadAllPulsarTenantsForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

const COLUMNS =
  "id, slug, title, status, event_date, capacity, price, currency, view_count, price_by_flow";

async function attendeeCount(client: SupabaseClient, eventId: string): Promise<number> {
  const { count } = await client
    .from("event_attendees")
    .select("id", { head: true, count: "exact" })
    .eq("event_id", eventId);
  return count ?? 0;
}

export async function appendSharedAdminEvents(input: {
  local: PaginatedAdminEventsResult;
  q: string;
}): Promise<PaginatedAdminEventsResult> {
  const tenant = await resolveRequestTenant();
  if (!tenant?.slug) return input.local;
  const grants = await listApprovedGrantsForGuest(eventShareGrantClient(), tenant.slug);
  if (grants.length === 0) return input.local;
  const tenants = await loadAllPulsarTenantsForAdmin();

  const needle = input.q.trim().toLowerCase();
  const shared: AdminEventRow[] = [];
  const clients = new Map<string, SupabaseClient | null>();
  for (const grant of grants) {
    if (!clients.has(grant.ownerSlug)) clients.set(grant.ownerSlug, ownerAdminClient(grant.ownerSlug));
    const client = clients.get(grant.ownerSlug);
    if (!client) continue;
    const { data } = await client
      .from("events")
      .select(COLUMNS)
      .eq("id", grant.ownerEventId)
      .is("archived_at", null)
      .maybeSingle();
    if (!data) continue;
    const title = String(data.title ?? "");
    const slug = String(data.slug ?? "");
    if (needle && !title.toLowerCase().includes(needle) && !slug.toLowerCase().includes(needle)) continue;
    shared.push({
      id: String(data.id),
      slug,
      title,
      status: String(data.status ?? ""),
      eventDate: String(data.event_date ?? ""),
      capacity: Number(data.capacity ?? 0),
      attendeesCount: await attendeeCount(client, String(data.id)),
      viewCount: Number(data.view_count ?? 0),
      price: data.price == null ? null : Number(data.price),
      currency: String(data.currency ?? "CLP"),
      priceByFlow: Boolean(data.price_by_flow),
      flowPrices: [],
      createdByName: "",
      ownerName: tenants.find((row) => row.slug === grant.ownerSlug)?.displayName ?? grant.ownerSlug,
    });
  }

  const totalCount = input.local.totalCount + shared.length;
  const pageStart = (input.local.page - 1) * input.local.pageSize;
  if (pageStart + input.local.rows.length < input.local.totalCount) {
    return { ...input.local, totalCount };
  }
  const overflow = Math.max(0, pageStart - input.local.totalCount);
  const need = input.local.pageSize - input.local.rows.length;
  return {
    ...input.local,
    rows: [...input.local.rows, ...shared.slice(overflow, overflow + need)],
    totalCount,
  };
}
