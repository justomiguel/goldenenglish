import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/**
 * Unread portal messages addressed to this admin.
 * The same number feeds the sidebar, the header icon, and the phone tab.
 * No date window. A read row (`read_at` set) is excluded.
 */
export async function loadAdminRecentInboundMessageCount(
  supabase: SupabaseClient,
  recipientUserId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("portal_messages")
    .select("id", { head: true, count: "exact" })
    .eq("recipient_id", recipientUserId)
    .is("read_at", null);

  if (error) {
    logSupabaseClientError("loadAdminRecentInboundMessageCount", error, {
      recipientUserId,
    });
    return 0;
  }
  return count ?? 0;
}
