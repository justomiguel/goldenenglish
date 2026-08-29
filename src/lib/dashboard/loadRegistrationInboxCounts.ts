import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countRegistrationInboxFilters,
  emptyRegistrationInboxCounts,
  type RegistrationInboxCounts,
} from "@/lib/register/countRegistrationInboxFilters";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type { RegistrationInboxCounts };

export async function loadRegistrationInboxCounts(
  supabase: SupabaseClient,
): Promise<RegistrationInboxCounts> {
  const { data, error } = await supabase
    .from("registrations")
    .select("status, intake_state, fee_snapshot, intent")
    .neq("status", "enrolled");
  if (error) {
    logSupabaseClientError("loadRegistrationInboxCounts", error);
    return emptyRegistrationInboxCounts();
  }
  return countRegistrationInboxFilters((data ?? []) as Array<{
    status: string;
    intake_state?: unknown;
    fee_snapshot?: unknown;
  }>);
}
