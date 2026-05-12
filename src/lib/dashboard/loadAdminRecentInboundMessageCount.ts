import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/** Matches `loadMessagesSummary` in `loadAdminHubSummary` — bounded recipient-scoped window. */
const RECENT_MESSAGE_BADGE_DAYS = 7;

/**
 * Count of portal messages addressed to this admin in the recent window (sidebar badge).
 */
export async function loadAdminRecentInboundMessageCount(
  supabase: SupabaseClient,
  recipientUserId: string,
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - RECENT_MESSAGE_BADGE_DAYS);
  const { count, error } = await supabase
    .from("portal_messages")
    .select("id", { head: true, count: "exact" })
    .eq("recipient_id", recipientUserId)
    .gte("created_at", since.toISOString());

  if (error) {
    logSupabaseClientError("loadAdminRecentInboundMessageCount", error, {
      recipientUserId,
    });
    return 0;
  }
  return count ?? 0;
}
