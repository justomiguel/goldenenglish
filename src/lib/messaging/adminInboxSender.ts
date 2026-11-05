import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

export const ADMIN_INBOX_SENDER_ROLES = ["teacher", "admin", "student", "parent"] as const;

/** True when the received list shows this sender. */
export function isAdminInboxSender(role: string | undefined, senderId: string): boolean {
  if (!role) return false;
  if ((ADMIN_INBOX_SENDER_ROLES as readonly string[]).includes(role)) return true;
  return role === "site_contact" && senderId === PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID;
}
