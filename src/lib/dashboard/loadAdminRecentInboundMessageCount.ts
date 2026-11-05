import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_INBOX_SENDER_ROLES } from "@/lib/messaging/adminInboxSender";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

/**
 * Unread messages in this admin's received list.
 * The same number feeds the sidebar, the header icon, and the phone tab.
 */
export async function loadAdminRecentInboundMessageCount(
  supabase: SupabaseClient,
  recipientUserId: string,
): Promise<number> {
  const roles = ADMIN_INBOX_SENDER_ROLES.join(",");
  const { count, error } = await supabase
    .from("portal_messages")
    .select("id, sender:profiles!portal_messages_sender_id_fkey!inner(id, role)", {
      head: true,
      count: "exact",
    })
    .eq("recipient_id", recipientUserId)
    .is("read_at", null)
    .or(`role.in.(${roles}),id.eq.${PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID}`, {
      referencedTable: "sender",
    });

  if (error) {
    logSupabaseClientError("loadAdminRecentInboundMessageCount", error, {
      recipientUserId,
    });
    return 0;
  }
  return count ?? 0;
}
