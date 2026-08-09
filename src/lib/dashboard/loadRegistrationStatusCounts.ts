import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface RegistrationStatusCounts {
  total: number;
  new: number;
  contacted: number;
}

const ZERO: RegistrationStatusCounts = { total: 0, new: 0, contacted: 0 };

interface AggregateRow {
  total: number | string | null;
  new_count: number | string | null;
  contacted_count: number | string | null;
}

function toCount(value: number | string | null | undefined): number {
  // Postgres bigint arrives as a string over PostgREST.
  const n = typeof value === "string" ? Number.parseInt(value, 10) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Status counts for the admin filter chips, scoped to the active search so the
 * chips can never label the list with totals it does not contain. A failure
 * degrades to zeros: the chips are a convenience, not a reason to break the page.
 */
export async function loadRegistrationStatusCounts(
  supabase: SupabaseClient,
  query: string,
): Promise<RegistrationStatusCounts> {
  const { data, error } = await supabase.rpc("registrations_admin_list_aggregates", {
    p_query: query,
  });

  if (error) {
    logSupabaseClientError("loadRegistrationStatusCounts", error, { query });
    return ZERO;
  }

  const row = (Array.isArray(data) ? data[0] : data) as AggregateRow | undefined | null;
  if (!row) return ZERO;

  return {
    total: toCount(row.total),
    new: toCount(row.new_count),
    contacted: toCount(row.contacted_count),
  };
}
