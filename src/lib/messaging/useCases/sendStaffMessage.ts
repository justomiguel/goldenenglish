import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import {
  notifyPortalInboxForStudentOrParent,
  notifyPortalRecipientForStaffMessage,
} from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { MESSAGING_UC_PERSIST_FAILED } from "@/lib/messaging/messagingUseCaseCodes";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

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
  if (error) {
    logSupabaseClientError("sendStaffMessageUseCase:insert", error, {
      senderId: input.senderId,
      recipientId: input.recipientId,
    });
    return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };
  }

  const { data: rec } = await input.supabase
    .from("profiles")
    .select("role")
    .eq("id", input.recipientId)
    .maybeSingle();

  const preview = stripHtmlToText(input.bodyHtml).slice(0, 500);
  try {
    if (rec?.role === "teacher" || rec?.role === "admin" || rec?.role === "assistant") {
      await notifyPortalRecipientForStaffMessage({
        recipientId: input.recipientId,
        senderName: input.senderDisplayName,
        messagePreview: preview || "(empty)",
        locale: input.locale,
        emailProvider: input.emailProvider,
        recipientRole: rec.role as "teacher" | "admin" | "assistant",
      });
    } else if (rec?.role === "student" || rec?.role === "parent") {
      await notifyPortalInboxForStudentOrParent({
        recipientId: input.recipientId,
        senderName: input.senderDisplayName,
        messagePreview: preview || "(empty)",
        locale: input.locale,
        emailProvider: input.emailProvider,
        recipientRole: rec.role as "student" | "parent",
      });
    }
  } catch (emailErr) {
    logServerException("sendStaffMessageUseCase:notifyEmail", emailErr, {
      senderId: input.senderId,
      recipientId: input.recipientId,
    });
  }

  return { ok: true };
}
