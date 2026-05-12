import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { buildPublicSiteContactMessageHtml } from "@/lib/messaging/buildPublicSiteContactMessageHtml";
import {
  notifyPortalRecipientForStaffMessage,
} from "@/lib/messaging/notifyMessagingEmails";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import {
  logServerException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

export type DeliverPublicSiteContactInput = {
  locale: string;
  subjectFieldLabel: string;
  subjectLabel: string;
  metaLines: { label: string; value: string }[];
  bodyPlain: string;
  senderDisplayName: string;
  /** Visitor email for admin reply-by-mail (persisted on portal_messages). */
  visitorReplyEmail: string;
  emailProvider?: EmailProvider;
};

/**
 * Inserts one portal_messages row per admin (service-role client; bypasses RLS).
 */
export async function deliverPublicSiteContactToAdmins(
  admin: SupabaseClient,
  input: DeliverPublicSiteContactInput,
): Promise<{ ok: true; delivered: number } | { ok: false; code: "no_admins" | "persist_failed" }> {
  const emailProvider = input.emailProvider ?? getEmailProvider();
  const { data: admins, error: listErr } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(200);

  if (listErr) {
    logSupabaseClientError("deliverPublicSiteContactToAdmins:listAdmins", listErr, {});
    return { ok: false, code: "persist_failed" };
  }

  const adminIds = [...new Set((admins ?? []).map((r) => r.id as string))].filter(
    (id) => id && id !== PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
  );
  if (adminIds.length === 0) {
    logServerWarn("deliverPublicSiteContactToAdmins:noAdmins", { scope: "publicContact" });
    return { ok: false, code: "no_admins" };
  }

  const bodyHtml = buildPublicSiteContactMessageHtml({
    subjectFieldLabel: input.subjectFieldLabel,
    subjectLabel: input.subjectLabel,
    bodyPlain: input.bodyPlain,
    metaLines: input.metaLines,
  });

  const preview = input.bodyPlain.trim().slice(0, 500);

  for (const recipientId of adminIds) {
    const { error: insErr } = await admin.from("portal_messages").insert({
      sender_id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
      recipient_id: recipientId,
      body_html: bodyHtml,
      external_contact_reply_email: input.visitorReplyEmail.trim(),
    });
    if (insErr) {
      logSupabaseClientError("deliverPublicSiteContactToAdmins:insert", insErr, {
        recipientId,
      });
      return { ok: false, code: "persist_failed" };
    }
    try {
      await notifyPortalRecipientForStaffMessage({
        recipientId,
        senderName: input.senderDisplayName,
        messagePreview: preview || "(empty)",
        locale: input.locale,
        emailProvider,
        recipientRole: "admin",
      });
    } catch (emailErr) {
      logServerException("deliverPublicSiteContactToAdmins:notifyEmail", emailErr, {
        recipientId,
      });
    }
  }

  return { ok: true, delivered: adminIds.length };
}
