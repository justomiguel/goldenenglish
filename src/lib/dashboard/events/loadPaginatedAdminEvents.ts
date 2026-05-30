import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";

export type EventSortKey = "title" | "event_date" | "attendees_count";

const SORT_COLUMN_MAP: Record<EventSortKey, string> = {
  title: "title",
  event_date: "event_date",
  attendees_count: "event_date",
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
}

export interface PaginatedAdminEventsParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: EventSortKey;
  dir?: "asc" | "desc";
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
    .select("id, slug, title, status, event_date, capacity, price, currency, view_count")
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
