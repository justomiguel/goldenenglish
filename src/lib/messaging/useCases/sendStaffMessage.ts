import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { notifyPortalRecipientForStaffMessage } from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";

export async function sendStaffMessageUseCase(input: {
  supabase: SupabaseClient;
  senderId: string;
  senderDisplayName: string;
  recipientId: string;
  bodyHtml: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await input.supabase.from("portal_messages").insert({
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    body_html: input.bodyHtml,
  });
  if (error) return { ok: false, message: error.message };

  const { data: rec } = await input.supabase
    .from("profiles")
    .select("role")
    .eq("id", input.recipientId)
    .maybeSingle();

  if (rec?.role === "teacher" || rec?.role === "admin") {
    const preview = stripHtmlToText(input.bodyHtml).slice(0, 500);
    try {
      await notifyPortalRecipientForStaffMessage({
        recipientId: input.recipientId,
        senderName: input.senderDisplayName,
        messagePreview: preview || "(empty)",
        locale: input.locale,
        emailProvider: input.emailProvider,
        recipientRole: rec.role as "teacher" | "admin",
      });
    } catch {
      /* best-effort */
    }
  }

  return { ok: true };
}
