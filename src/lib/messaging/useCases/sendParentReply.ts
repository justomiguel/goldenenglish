import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyPortalRecipientForStaffMessage,
  notifyTeacherNewMessage,
} from "@/lib/messaging/notifyMessagingEmails";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import {
  MESSAGING_UC_PERSIST_FAILED,
  MESSAGING_UC_REPLY_INVALID_SENDER,
  MESSAGING_UC_REPLY_NOT_FOUND,
} from "@/lib/messaging/messagingUseCaseCodes";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type ParentReplyRecipientRole = "admin" | "teacher";

function isParentReplyRecipientRole(role: string | null | undefined): role is ParentReplyRecipientRole {
  return role === "admin" || role === "teacher";
}

export async function sendParentReplyUseCase(input: {
  supabase: SupabaseClient;
  parentId: string;
  parentDisplayName: string;
  recipientId: string;
  bodyHtml: string;
  locale: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true; recipientRole: ParentReplyRecipientRole } | { ok: false; message: string }> {
  const { data: prior, error: priorErr } = await input.supabase
    .from("portal_messages")
    .select("id")
    .eq("sender_id", input.recipientId)
    .eq("recipient_id", input.parentId)
    .limit(1);

  if (priorErr) {
    logSupabaseClientError("sendParentReplyUseCase:prior", priorErr, {
      parentId: input.parentId,
      recipientId: input.recipientId,
    });
    return { ok: false, message: MESSAGING_UC_REPLY_NOT_FOUND };
  }
  if (!prior || prior.length === 0) {
    return { ok: false, message: MESSAGING_UC_REPLY_NOT_FOUND };
  }

  const admin = await createAdminClient();
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", input.recipientId)
    .maybeSingle();

  if (profileErr) {
    logSupabaseClientError("sendParentReplyUseCase:role", profileErr, {
      recipientId: input.recipientId,
    });
    return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };
  }
  const recipientRole = profile?.role;
  if (!isParentReplyRecipientRole(recipientRole)) {
    return { ok: false, message: MESSAGING_UC_REPLY_INVALID_SENDER };
  }

  const { error } = await input.supabase.from("portal_messages").insert({
    sender_id: input.parentId,
    recipient_id: input.recipientId,
    body_html: input.bodyHtml,
  });
  if (error) {
    logSupabaseClientError("sendParentReplyUseCase:insert", error, {
      parentId: input.parentId,
      recipientId: input.recipientId,
    });
    return { ok: false, message: MESSAGING_UC_PERSIST_FAILED };
  }

  const preview = stripHtmlToText(input.bodyHtml).slice(0, 500);
  try {
    if (recipientRole === "teacher") {
      await notifyTeacherNewMessage({
        teacherId: input.recipientId,
        senderName: input.parentDisplayName,
        messagePreview: preview || "(empty)",
        locale: input.locale,
        emailProvider: input.emailProvider,
      });
    } else {
      await notifyPortalRecipientForStaffMessage({
        recipientId: input.recipientId,
        senderName: input.parentDisplayName,
        messagePreview: preview || "(empty)",
        locale: input.locale,
        emailProvider: input.emailProvider,
        recipientRole: "admin",
        source: "parent_reply",
      });
    }
  } catch (emailErr) {
    logServerException("sendParentReplyUseCase:notify", emailErr, {
      parentId: input.parentId,
      recipientId: input.recipientId,
    });
  }

  return { ok: true, recipientRole };
}
