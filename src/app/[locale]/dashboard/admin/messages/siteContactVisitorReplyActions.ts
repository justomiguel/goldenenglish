"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerException, logServerWarn } from "@/lib/logging/serverActionLog";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadAdminPortalReplyComposeContext } from "@/lib/dashboard/loadAdminPortalReplyComposeContext";
import { getBrandForRequest } from "@/lib/brand/server";
import { sendAdminSiteContactVisitorReplyEmail } from "@/lib/messaging/useCases/sendAdminSiteContactVisitorReplyEmail";
import { markAdminPortalExternalReplied } from "@/lib/messaging/markAdminPortalMessageAttention";
import { persistAdminSiteContactVisitorReplySentCopy } from "@/lib/messaging/persistAdminSiteContactVisitorReplySentCopy";
import type { Locale } from "@/types/i18n";

const bodySchema = z.string().min(1).max(80000);
const messageIdSchema = z.string().uuid();

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

  const { data: sourceRow } = await supabase
    .from("portal_messages")
    .select("broadcast_batch_id, external_contact_display_name")
    .eq("id", mid.data)
    .maybeSingle();

  await markAdminPortalExternalReplied(supabase, {
    messageId: mid.data,
    broadcastBatchId: (sourceRow?.broadcast_batch_id as string | null) ?? null,
  });

  const sentCopy = await persistAdminSiteContactVisitorReplySentCopy({
    adminUserId: user.id,
    bodyHtml: safeHtml,
    visitorEmail: ctx.visitorEmail,
    visitorDisplayName:
      (sourceRow?.external_contact_display_name as string | null | undefined) ?? null,
  });
  if (!sentCopy.ok) {
    logServerWarn("sendAdminSiteContactVisitorReply:sentCopyFailed", {
      scope: "adminMessages",
      sourceMessageId: mid.data,
    });
  }

  void recordSystemAudit({
    action: "admin_site_contact_visitor_reply_sent",
    resourceType: "portal_message",
    resourceId: mid.data,
    payload: { sentCopyPersisted: sentCopy.ok },
  });

  revalidatePath(`/${locale}/dashboard/admin/messages`);
  revalidatePath(`/${locale}/dashboard/admin/messages/compose`);
  revalidatePath(`/${locale}/dashboard/admin/messages/${mid.data}`);
  return { ok: true };
}
