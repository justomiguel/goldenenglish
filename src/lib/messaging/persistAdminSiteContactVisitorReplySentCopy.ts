import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type PersistAdminSiteContactVisitorReplySentCopyInput = {
  adminUserId: string;
  bodyHtml: string;
  visitorEmail: string;
  visitorDisplayName: string | null;
  /** Injected in tests; production uses createAdminClient(). */
  adminClient?: SupabaseClient;
};

/**
 * Persists an outbound Sent copy after a successful visitor email reply.
 * Uses service-role because authenticated admin INSERT RLS cannot target site_contact recipients.
 */
export async function persistAdminSiteContactVisitorReplySentCopy(
  input: PersistAdminSiteContactVisitorReplySentCopyInput,
): Promise<{ ok: true } | { ok: false }> {
  const admin = input.adminClient ?? createAdminClient();
  const display = input.visitorDisplayName?.trim() || null;
  const { error } = await admin.from("portal_messages").insert({
    sender_id: input.adminUserId,
    recipient_id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
    body_html: input.bodyHtml,
    external_contact_reply_email: input.visitorEmail.trim(),
    external_contact_display_name: display,
    read_at: new Date().toISOString(),
  });

  if (error) {
    logSupabaseClientError("persistAdminSiteContactVisitorReplySentCopy:insert", error, {
      scope: "adminMessages",
      adminUserId: input.adminUserId,
    });
    return { ok: false };
  }
  return { ok: true };
}
