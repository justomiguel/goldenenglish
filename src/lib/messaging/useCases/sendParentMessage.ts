import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { notifyTeacherNewMessage } from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import {
  MESSAGING_UC_INVALID_RECIPIENT,
  MESSAGING_UC_PERSIST_FAILED,
} from "@/lib/messaging/messagingUseCaseCodes";

async function parentCanMessageTeacher(
  supabase: SupabaseClient,
  parentId: string,
  teacherId: string,
): Promise<boolean> {
  const { data: links, error: relErr } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", parentId);
  if (relErr || !links?.length) return false;

  const studentIds = [...new Set(links.map((r) => r.student_id as string))];
  const { data: rows, error: stErr } = await supabase
    .from("profiles")
    .select("id")
    .in("id", studentIds)
    .eq("assigned_teacher_id", teacherId)
    .limit(1);
  if (stErr) return false;
  return (rows?.length ?? 0) > 0;
}

export async function sendParentMessageUseCase(input: {
  supabase: SupabaseClient;
  parentId: string;
  parentDisplayName: string;
  teacherId: string;
  bodyHtml: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const allowed = await parentCanMessageTeacher(input.supabase, input.parentId, input.teacherId);
  if (!allowed) {
    return { ok: false, message: MESSAGING_UC_INVALID_RECIPIENT };
  }

  const { error } = await input.supabase.from("portal_messages").insert({
    sender_id: input.parentId,
    recipient_id: input.teacherId,
    body_html: input.bodyHtml,
  });
  if (error) return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };

  const preview = stripHtmlToText(input.bodyHtml).slice(0, 500);
  try {
    await notifyTeacherNewMessage({
      teacherId: input.teacherId,
      senderName: input.parentDisplayName,
      messagePreview: preview || "(empty)",
      locale: input.locale,
      emailProvider: input.emailProvider,
    });
  } catch {
    /* best-effort */
  }

  return { ok: true };
}
