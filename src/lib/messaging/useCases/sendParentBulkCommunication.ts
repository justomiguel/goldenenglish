import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailProvider } from "@/lib/email/emailProvider";
import { sendWrappedHtmlEmail } from "@/lib/email/templates/sendWrappedHtmlEmail";
import type { Locale } from "@/types/i18n";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";
import { buildParentBulkEmailPlan } from "@/lib/parents/buildParentBulkEmailPlan";
import { fillParentMailPlaceholders } from "@/lib/parents/fillParentMailPlaceholders";
import type { ParentMailMode, ParentRecipient } from "@/lib/parents/parentRecipient";

const EMAIL_CHUNK = 50;

export type ParentBulkSendResult = {
  portalOk: number;
  emailed: number;
  skippedSynthetic: number;
  failed: number;
  persistFailed: number;
};

export async function sendParentBulkCommunication(input: {
  supabase: SupabaseClient;
  senderId: string;
  parents: ParentRecipient[];
  mode: ParentMailMode;
  subject: string;
  html: string;
  fromAddress: string;
  locale: Locale;
  emailProvider: EmailProvider;
}): Promise<ParentBulkSendResult> {
  const safeHtml = sanitizeMessageHtml(input.html);
  const plan = buildParentBulkEmailPlan({
    parents: input.parents,
    mode: input.mode,
    subject: input.subject.trim(),
    html: safeHtml,
    fromAddress: input.fromAddress,
  });

  let portalOk = 0;
  let persistFailed = 0;
  const parentById = new Map(input.parents.map((p) => [p.id, p]));

  for (const parentId of plan.portalIds) {
    const parent = parentById.get(parentId);
    const bodyHtml =
      input.mode === "individual" && parent
        ? sanitizeMessageHtml(fillParentMailPlaceholders(input.html, parent))
        : safeHtml;
    if (stripHtmlToText(bodyHtml).length === 0) {
      persistFailed += 1;
      continue;
    }
    const { error } = await input.supabase.from("portal_messages").insert({
      sender_id: input.senderId,
      recipient_id: parentId,
      body_html: bodyHtml,
    });
    if (error) {
      logSupabaseClientError("sendParentBulkCommunication:insert", error, { parentId });
      persistFailed += 1;
      continue;
    }
    portalOk += 1;
  }

  let emailed = 0;
  let failed = 0;
  for (let i = 0; i < plan.emails.length; i += EMAIL_CHUNK) {
    const chunk = plan.emails.slice(i, i + EMAIL_CHUNK);
    for (const mail of chunk) {
      const r = await sendWrappedHtmlEmail({
        to: mail.to,
        subject: mail.subject,
        bodyHtml: mail.html,
        locale: input.locale,
        emailProvider: input.emailProvider,
        cc: mail.cc,
        bcc: mail.bcc,
      });
      if (r.ok) emailed += 1;
      else failed += 1;
    }
  }

  return {
    portalOk,
    emailed,
    skippedSynthetic: plan.skippedSynthetic,
    failed,
    persistFailed,
  };
}
