import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { notifyTeacherNewMessage } from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import {
  MESSAGING_UC_INVALID_RECIPIENT,
  MESSAGING_UC_PERSIST_FAILED,
} from "@/lib/messaging/messagingUseCaseCodes";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { parentCanMessageTeacher } from "@/lib/messaging/loadParentLinkedTeacherIds";

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
  if (error) {
    logSupabaseClientError("sendParentMessageUseCase:insert", error, {
      parentId: input.parentId,
      teacherId: input.teacherId,
    });
    return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };
  }

  const preview = stripHtmlToText(input.bodyHtml).slice(0, 500);
  try {
    await notifyTeacherNewMessage({
      teacherId: input.teacherId,
      senderName: input.parentDisplayName,
      messagePreview: preview || "(empty)",
      locale: input.locale,
      emailProvider: input.emailProvider,
    });
  } catch (emailErr) {
    logServerException("sendParentMessageUseCase:notifyTeacherNewMessage", emailErr, {
      parentId: input.parentId,
      teacherId: input.teacherId,
    });
  }

  return { ok: true };
}
