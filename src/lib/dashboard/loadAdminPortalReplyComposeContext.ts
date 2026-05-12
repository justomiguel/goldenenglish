import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import { resolveSiteContactVisitorReplyEmail } from "@/lib/messaging/siteContactVisitorReplyEmail";
import type { AdminPortalReplyBootstrap } from "@/types/adminPortalCompose";

function counterpartyProfileId(adminUserId: string, senderId: string, recipientId: string): string | null {
  if (recipientId === adminUserId) return senderId;
  if (senderId === adminUserId) return recipientId;
  return null;
}

export async function loadAdminPortalReplyComposeContext(
  supabase: SupabaseClient,
  adminUserId: string,
  replyToMessageId: string | undefined,
): Promise<AdminPortalReplyBootstrap> {
  if (!replyToMessageId?.trim()) return { kind: "none" };

  const parsed = z.string().uuid().safeParse(replyToMessageId.trim());
  if (!parsed.success) return { kind: "error", code: "invalid_or_forbidden" };

  const { data: row, error } = await supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id, external_contact_reply_email, body_html")
    .eq("id", parsed.data)
    .maybeSingle();

  if (error || !row) return { kind: "error", code: "invalid_or_forbidden" };

  const senderId = row.sender_id as string;
  const recipientId = row.recipient_id as string;
  const cp = counterpartyProfileId(adminUserId, senderId, recipientId);
  if (!cp) return { kind: "error", code: "invalid_or_forbidden" };

  if (cp === PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID) {
    const visitorEmail = resolveSiteContactVisitorReplyEmail({
      external_contact_reply_email: row.external_contact_reply_email as string | null,
      body_html: row.body_html as string,
    });
    if (!visitorEmail) return { kind: "error", code: "missing_visitor_email" };
    return { kind: "external_email", sourceMessageId: row.id as string, visitorEmail };
  }

  return { kind: "portal", recipientProfileId: cp };
}
