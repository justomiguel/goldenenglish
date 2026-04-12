import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { resolveTeacherIdForStudent } from "@/lib/messaging/resolveTeacherId";
import { notifyTeacherNewMessage } from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import {
  MESSAGING_UC_NO_TEACHER,
  MESSAGING_UC_PERSIST_FAILED,
} from "@/lib/messaging/messagingUseCaseCodes";

export async function sendStudentMessageUseCase(input: {
  supabase: SupabaseClient;
  studentId: string;
  studentDisplayName: string;
  bodyHtml: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const teacherId = await resolveTeacherIdForStudent(input.supabase, input.studentId);
  if (!teacherId) {
    return { ok: false, message: MESSAGING_UC_NO_TEACHER };
  }

  const { error } = await input.supabase.from("portal_messages").insert({
    sender_id: input.studentId,
    recipient_id: teacherId,
    body_html: input.bodyHtml,
  });
  if (error) return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };

  const preview = stripHtmlToText(input.bodyHtml).slice(0, 500);
  try {
    await notifyTeacherNewMessage({
      teacherId,
      senderName: input.studentDisplayName,
      messagePreview: preview || "(empty)",
      locale: input.locale,
      emailProvider: input.emailProvider,
    });
  } catch {
    /* email is best-effort; message is persisted */
  }

  return { ok: true };
}
