import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { notifyStudentTeacherReplied } from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";

export async function replyToStudentMessageUseCase(input: {
  supabase: SupabaseClient;
  messageId: string;
  teacherId: string;
  teacherDisplayName: string;
  replyHtml: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: row, error: fetchErr } = await input.supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id")
    .eq("id", input.messageId)
    .eq("recipient_id", input.teacherId)
    .maybeSingle();

  if (fetchErr || !row) return { ok: false, message: "Message not found" };

  const { data: senderProfile } = await input.supabase
    .from("profiles")
    .select("role")
    .eq("id", row.sender_id as string)
    .maybeSingle();

  if (senderProfile?.role !== "student") {
    return { ok: false, message: "Can only reply to student messages" };
  }

  const { error } = await input.supabase.from("portal_messages").insert({
    sender_id: input.teacherId,
    recipient_id: row.sender_id as string,
    body_html: input.replyHtml,
  });

  if (error) return { ok: false, message: error.message };

  const preview = stripHtmlToText(input.replyHtml).slice(0, 500);
  try {
    await notifyStudentTeacherReplied({
      studentId: row.sender_id as string,
      teacherName: input.teacherDisplayName,
      replyPreview: preview || "(empty)",
      locale: input.locale,
      emailProvider: input.emailProvider,
    });
  } catch {
    /* best-effort */
  }

  return { ok: true };
}
