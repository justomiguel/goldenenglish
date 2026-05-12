"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { isRecipientAllowedForAdmin } from "@/lib/messaging/messagingRecipientRules";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { mapMessagingUseCaseCode } from "@/lib/messaging/mapMessagingUseCaseCode";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { loadAdminPortalReplyComposeContext } from "@/lib/dashboard/loadAdminPortalReplyComposeContext";
import { getBrandForRequest } from "@/lib/brand/server";
import { sendAdminSiteContactVisitorReplyEmail } from "@/lib/messaging/useCases/sendAdminSiteContactVisitorReplyEmail";
import type { Locale } from "@/types/i18n";

const bodySchema = z.string().min(1).max(80000);
const messageIdSchema = z.string().uuid();

export async function sendAdminMessage(
  locale: string,
  recipientId: string,
  bodyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const senderFallback = dict.admin.messages.senderNameFallback;

  const rid = z.string().uuid().safeParse(recipientId);
  if (!rid.success) return { ok: false, message: msg.invalidRecipient };

  const parsed = bodySchema.safeParse(bodyHtml);
  if (!parsed.success) return { ok: false, message: msg.invalidMessage };
  const safeHtml = sanitizeMessageHtml(parsed.data);
  if (stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: msg.emptyMessage };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: msg.unauthorized };

  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false, message: msg.forbidden };

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", rid.data)
    .maybeSingle();
  if (!isRecipientAllowedForAdmin(recipientProfile?.role, user.id, rid.data)) {
    return { ok: false, message: msg.invalidRecipient };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile
    ? formatProfileNameSurnameFirst(profile.first_name, profile.last_name)
    : senderFallback;
  const result = await sendStaffMessageUseCase({
    supabase,
    senderId: user.id,
    senderDisplayName: name || senderFallback,
    recipientId: rid.data,
    bodyHtml: safeHtml,
    locale,
    emailProvider: getEmailProvider(),
  });

  if (!result.ok) {
    return { ok: false, message: mapMessagingUseCaseCode(result.message, msg) };
  }
  revalidatePath(`/${locale}/dashboard/admin/messages`);
  revalidatePath(`/${locale}/dashboard/admin/messages/compose`);
  return { ok: true };
}

export async function sendAdminSiteContactVisitorReply(
  locale: string,
  sourceMessageId: string,
  bodyHtml: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const msg = dict.actionErrors.messaging;
  const labels = dict.admin.messages;

  const mid = messageIdSchema.safeParse(sourceMessageId);
  if (!mid.success) return { ok: false, message: msg.invalidId };

  const parsed = bodySchema.safeParse(bodyHtml);
  if (!parsed.success) return { ok: false, message: msg.invalidMessage };
  const safeHtml = sanitizeMessageHtml(parsed.data);
  if (stripHtmlToText(safeHtml).length === 0) {
    return { ok: false, message: msg.emptyMessage };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: msg.unauthorized };

  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false, message: msg.forbidden };

  const ctx = await loadAdminPortalReplyComposeContext(supabase, user.id, mid.data);
  if (ctx.kind !== "external_email") {
    if (ctx.kind === "portal") return { ok: false, message: msg.invalidReply };
    if (ctx.kind === "error" && ctx.code === "missing_visitor_email") {
      return { ok: false, message: labels.composeReplyMissingVisitorEmail };
    }
    return { ok: false, message: labels.composeReplyInvalidTarget };
  }

  const localeNorm: Locale = locale === "en" ? "en" : "es";
  const brand = await getBrandForRequest();
  const subject = labels.composeExternalReplySubject.replace("{{brand}}", brand.name);

  const sendResult = await sendAdminSiteContactVisitorReplyEmail({
    locale: localeNorm,
    toEmail: ctx.visitorEmail,
    subject,
    bodyHtml: safeHtml,
    emailProvider: getEmailProvider(),
  });

  if (!sendResult.ok) {
    logServerException("sendAdminSiteContactVisitorReply:email", new Error(sendResult.error), {
      scope: "adminMessages",
      sourceMessageId: mid.data,
    });
    return { ok: false, message: labels.composeExternalReplyEmailFailed };
  }

  void recordSystemAudit({
    action: "admin_site_contact_visitor_reply_sent",
    resourceType: "portal_message",
    resourceId: mid.data,
    payload: {},
  });

  revalidatePath(`/${locale}/dashboard/admin/messages`);
  revalidatePath(`/${locale}/dashboard/admin/messages/compose`);
  revalidatePath(`/${locale}/dashboard/admin/messages/${mid.data}`);
  return { ok: true };
}

export type DeleteAdminPortalMessageCode =
  | "invalid_id"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "persist_failed";

export async function deleteAdminPortalMessage(
  locale: string,
  messageId: string,
): Promise<{ ok: true } | { ok: false; code: DeleteAdminPortalMessageCode }> {
  const parsed = messageIdSchema.safeParse(messageId);
  if (!parsed.success) return { ok: false, code: "invalid_id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "unauthorized" };

  const allowed = await resolveIsAdminSession(supabase, user.id);
  if (!allowed) return { ok: false, code: "forbidden" };

  const { data: deleted, error } = await supabase
    .from("portal_messages")
    .delete()
    .eq("id", parsed.data)
    .select("id");

  if (error) {
    logSupabaseClientError("deleteAdminPortalMessage", error, { messageId: parsed.data });
    return { ok: false, code: "persist_failed" };
  }
  if (!deleted?.length) {
    logServerWarn("deleteAdminPortalMessage:noRow", {
      scope: "adminMessages",
      messageId: parsed.data,
    });
    return { ok: false, code: "not_found" };
  }

  void recordSystemAudit({
    action: "portal_message_deleted",
    resourceType: "portal_message",
    resourceId: parsed.data,
    payload: {},
  });

  revalidatePath(`/${locale}/dashboard/admin/messages`);
  revalidatePath(`/${locale}/dashboard/admin/messages/${parsed.data}`);
  return { ok: true };
}
