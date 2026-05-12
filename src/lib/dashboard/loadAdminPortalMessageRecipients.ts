import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessagingRecipient } from "@/types/messaging";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

/**
 * Profiles eligible as admin compose recipients (bounded list).
 */
export async function loadAdminPortalMessageRecipients(
  admin: SupabaseClient,
  currentUserId: string,
): Promise<MessagingRecipient[]> {
  const { data: people } = await admin
    .from("profiles")
    .select("id, first_name, last_name, role")
    .neq("id", currentUserId)
    .neq("id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID)
    .in("role", ["student", "parent", "teacher", "admin"])
    .order("role", { ascending: true })
    .order("last_name", { ascending: true })
    .limit(500);

  return (people ?? []).map((p) => ({
    id: p.id as string,
    first_name: p.first_name as string,
    last_name: p.last_name as string,
    role: p.role as string,
  }));
}
