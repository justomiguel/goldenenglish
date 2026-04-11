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
    .from("student_messages")
    .select("id, student_id, reply_html")
    .eq("id", input.messageId)
    .eq("teacher_id", input.teacherId)
    .maybeSingle();

  if (fetchErr || !row) return { ok: false, message: "Message not found" };
  if (row.reply_html) return { ok: false, message: "Already replied" };

  const { error } = await input.supabase
    .from("student_messages")
    .update({
      reply_html: input.replyHtml,
      replied_at: new Date().toISOString(),
    })
    .eq("id", input.messageId)
    .eq("teacher_id", input.teacherId)
    .is("reply_html", null);

  if (error) return { ok: false, message: error.message };

  const preview = stripHtmlToText(input.replyHtml).slice(0, 500);
  try {
    await notifyStudentTeacherReplied({
      studentId: row.student_id as string,
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
