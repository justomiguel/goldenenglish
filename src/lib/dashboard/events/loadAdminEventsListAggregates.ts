import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface AdminEventsListAggregates {
  totalEvents: number;
  totalPublished: number;
  totalUpcoming: number;
  totalAttendees: number;
  totalWaitlist: number;
}

const EMPTY: AdminEventsListAggregates = {
  totalEvents: 0,
  totalPublished: 0,
  totalUpcoming: 0,
  totalAttendees: 0,
  totalWaitlist: 0,
};

export async function loadAdminEventsListAggregates(
  adminClient: SupabaseClient,
  search: string,
): Promise<AdminEventsListAggregates> {
  const { data, error } = await adminClient.rpc("events_admin_list_aggregates", {
    p_search: search,
    p_status: null,
  });

  if (error) {
    logSupabaseClientError("loadAdminEventsListAggregates:rpc", error, {});
    return EMPTY;
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return EMPTY;
  return {
    totalEvents: Number(row.total_events ?? 0),
    totalPublished: Number(row.total_published ?? 0),
    totalUpcoming: Number(row.total_upcoming ?? 0),
    totalAttendees: Number(row.total_attendees ?? 0),
    totalWaitlist: Number(row.total_waitlist ?? 0),
  };
}
