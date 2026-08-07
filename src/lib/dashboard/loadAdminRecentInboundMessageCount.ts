import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/**
 * Total portal messages addressed to this admin (sidebar Messages badge).
 * Unbounded by date — full inbound mailbox count for the recipient.
 */
export async function loadAdminRecentInboundMessageCount(
  supabase: SupabaseClient,
  recipientUserId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("portal_messages")
    .select("id", { head: true, count: "exact" })
    .eq("recipient_id", recipientUserId);

  if (error) {
    logSupabaseClientError("loadAdminRecentInboundMessageCount", error, {
      recipientUserId,
    });
    return 0;
  }
  return count ?? 0;
}
