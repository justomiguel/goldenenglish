import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalBirthdayRpcRow } from "@/types/birthdays";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function fetchPortalBirthdaysForViewer(
  supabase: SupabaseClient,
  viewerId: string,
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<PortalBirthdayRpcRow[]> {
  const { data, error } = await supabase.rpc("portal_upcoming_birthdays_for_viewer", {
    p_viewer_id: viewerId,
    p_range_start: rangeStartIso,
    p_range_end: rangeEndIso,
  });
  if (error) {
    logSupabaseClientError("fetchPortalBirthdaysForViewer", error, { scope: "birthdays" });
    return [];
  }
  return (data ?? []) as PortalBirthdayRpcRow[];
}
