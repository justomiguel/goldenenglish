import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";
import type { EventFlowPrice } from "@/lib/events/formatEventFlowPrice";
import { isEventLocale } from "@/lib/events/domain";
import { loadRegistrationFlowPricesByEvent } from "@/lib/events/server/loadActiveRegistrationFlows";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type EventSortKey = "title" | "event_date" | "attendees_count" | "status" | "views" | "price";

const SORT_COLUMN_MAP: Record<EventSortKey, string> = {
  title: "title",
  event_date: "event_date",
  attendees_count: "event_date",
  status: "status",
  views: "view_count",
  price: "price",
};

export interface AdminEventRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  eventDate: string;
  capacity: number;
  attendeesCount: number;
  viewCount: number;
  price: number | null;
  currency: string;
  priceByFlow: boolean;
  flowPrices: EventFlowPrice[];
  createdByName: string;
}

export interface PaginatedAdminEventsParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: EventSortKey;
  dir?: "asc" | "desc";
  locale?: string;
}

export interface PaginatedAdminEventsResult {
  rows: AdminEventRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function loadPaginatedAdminEvents(
  adminClient: SupabaseClient,
  params: PaginatedAdminEventsParams = {},
): Promise<PaginatedAdminEventsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_TABLE_PAGE_SIZE;
  const sortColumn = SORT_COLUMN_MAP[params.sort ?? "event_date"] ?? "event_date";
  const ascending = (params.dir ?? "asc") === "asc";
  const q = (params.q ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = adminClient
    .from("events")
    .select(
      "id, slug, title, status, event_date, capacity, price, currency, view_count, price_by_flow, default_locale, created_by",
    )
    .is("archived_at", null);

  let countQuery = adminClient
    .from("events")
    .select("id", { head: true, count: "exact" })
    .is("archived_at", null);

  if (q) {
    const pattern = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const filter = `title.ilike.${pattern},slug.ilike.${pattern}`;
    dataQuery = dataQuery.or(filter);
    countQuery = countQuery.or(filter);
  }

  const [dataResult, countResult] = await Promise.all([
    dataQuery.order(sortColumn, { ascending }).range(from, to),
    countQuery,
  ]);

  const eventIds = (dataResult.data ?? []).map((row) => String(row.id));
  const attendeeCounts = new Map<string, number>();
  if (eventIds.length > 0) {
    const { data: attendeeRows } = await adminClient
      .from("event_attendees")
      .select("event_id")
      .in("event_id", eventIds);
    for (const row of attendeeRows ?? []) {
      const eventId = String(row.event_id ?? "");
      attendeeCounts.set(eventId, (attendeeCounts.get(eventId) ?? 0) + 1);
    }
  }

  const creatorIds = [
    ...new Set(
      (dataResult.data ?? [])
        .map((row) => (row.created_by ? String(row.created_by) : ""))
        .filter((id) => id.length > 0),
    ),
  ];
  const creatorNames = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profileRows, error: profileError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", creatorIds);
    if (profileError) {
      logSupabaseClientError("loadPaginatedAdminEvents:creators", profileError, {
        creatorCount: creatorIds.length,
      });
    }
    for (const profile of profileRows ?? []) {
      creatorNames.set(
        String(profile.id),
        formatProfileNameSurnameFirst(profile.first_name, profile.last_name),
      );
    }
  }

  const locale = params.locale ?? "es";
  const pricedEvents = (dataResult.data ?? [])
    .filter((row) => Boolean(row.price_by_flow))
    .map((row) => ({
      id: String(row.id),
      defaultLocale: isEventLocale(String(row.default_locale ?? "es"))
        ? String(row.default_locale)
        : "es",
    }));
  const flowPricesByEvent = await loadRegistrationFlowPricesByEvent(adminClient, pricedEvents, locale);

  const rows: AdminEventRow[] = (dataResult.data ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    status: String(row.status),
    eventDate: String(row.event_date ?? ""),
    capacity: Number(row.capacity ?? 0),
    attendeesCount: attendeeCounts.get(String(row.id)) ?? 0,
    viewCount: Number(row.view_count ?? 0),
    price: row.price == null ? null : Number(row.price),
    currency: String(row.currency ?? "CLP"),
    priceByFlow: Boolean(row.price_by_flow),
    flowPrices: flowPricesByEvent.get(String(row.id)) ?? [],
    createdByName: creatorNames.get(String(row.created_by ?? "")) ?? "",
  }));

  if ((params.sort ?? "event_date") === "attendees_count") {
    rows.sort((a, b) =>
      (params.dir ?? "asc") === "asc"
        ? a.attendeesCount - b.attendeesCount
        : b.attendeesCount - a.attendeesCount,
    );
  }

  return {
    rows,
    totalCount: countResult.count ?? 0,
    page,
    pageSize,
  };
}
