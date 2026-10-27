import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { batchAuthEmailsForUserIds } from "@/lib/auth/batchAuthEmailsForUserIds";
import { getBrandForRequest } from "@/lib/brand/server";
import { buildAdminMessageContactHrefs, type AdminMessageContactHrefs } from "@/lib/messaging/adminMessageContactLinks";
import {
  buildAdminMessageStatusStack,
  matchLatestStaffAnswer,
  type AdminMessageStatusLine,
  type StaffAnswerCandidate,
} from "@/lib/messaging/adminMessageStatus";
import { resolveContactWhatsAppDigits } from "@/lib/messaging/extractContactMetaPhone";
import { loadAdminMessageFollowUpFacts } from "@/lib/messaging/loadAdminMessageFollowUpFacts";
import {
  MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES,
  pickMessagingDefaultReplyTemplate,
} from "@/lib/messaging/messagingDefaultReplyConstants";
import { loadMessagingDefaultReplyTemplate } from "@/lib/messaging/loadMessagingDefaultReplyTemplate";
import { resolveMessagingDefaultReplyPlain } from "@/lib/messaging/resolveMessagingDefaultReplyTemplate";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { resolveSiteContactVisitorDisplayName } from "@/lib/messaging/siteContactVisitorDisplayName";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveWhatsAppCountry, resolveWhatsAppDigits } from "@/lib/whatsapp/resolveWhatsAppDigits";

const EMPTY_HREFS: AdminMessageContactHrefs = {
  mailto: null,
  gmail: null,
  outlook: null,
  whatsapp: null,
};

type MessageRow = {
  id: string;
  sender_id: string;
  body_html: string;
  created_at: string;
  read_at: string | null;
  external_contact_reply_email: string | null;
  external_contact_display_name: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  phone: string | null;
};

export type AdminPortalMessageOutcome = {
  lines: AdminMessageStatusLine[];
  hrefs: AdminMessageContactHrefs;
};

function fillName(template: string, name: string): string {
  return template.replaceAll("{{name}}", name);
}

export async function loadAdminPortalMessageOutcome(
  supabase: SupabaseClient,
  messageId: string,
  locale: string,
  dict: Dictionary,
): Promise<AdminPortalMessageOutcome> {
  const { data, error } = await supabase
    .from("portal_messages")
    .select(
      "id, sender_id, body_html, created_at, read_at, external_contact_reply_email, external_contact_display_name",
    )
    .eq("id", messageId)
    .maybeSingle();

  if (error || !data) {
    if (error) logSupabaseClientError("loadAdminPortalMessageOutcome", error, { messageId });
    return { lines: [], hrefs: EMPTY_HREFS };
  }

  const row = data as MessageRow;
  const { data: senderData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, phone")
    .eq("id", row.sender_id)
    .maybeSingle();
  const sender = senderData as ProfileRow | null;
  const source = sender?.role === "site_contact" ? "contact_form" : "internal";
  const visitorEmail = row.external_contact_reply_email;

  let replyQuery = supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id, body_html, created_at, external_contact_reply_email")
    .eq("recipient_id", row.sender_id)
    .gt("created_at", row.created_at);
  if (source === "contact_form" && visitorEmail) {
    replyQuery = replyQuery.eq("external_contact_reply_email", visitorEmail);
  }
  const boundedReplyQuery = replyQuery.order("created_at", { ascending: false }).limit(40);
  const { data: replyRows } = source === "contact_form" && !visitorEmail
    ? { data: [] as Record<string, unknown>[] }
    : await boundedReplyQuery;

  const replyList = (replyRows ?? []) as Array<{
    id: string;
    sender_id: string;
    recipient_id: string;
    body_html: string;
    created_at: string;
    external_contact_reply_email: string | null;
  }>;
  const senderIds = [...new Set(replyList.map((item) => item.sender_id))];
  const { data: staffProfiles } = senderIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, role").in("id", senderIds)
    : { data: [] as ProfileRow[] };

  const staffById = new Map(
    ((staffProfiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
  const candidates: StaffAnswerCandidate[] = replyList.map((item) => {
    const staff = staffById.get(item.sender_id);
    return {
      id: item.id,
      senderId: item.sender_id,
      recipientId: item.recipient_id,
      createdAt: item.created_at,
      senderRole: staff?.role ?? "",
      senderName: staff ? formatProfileSnakeSurnameFirst(staff) : dict.common.emptyValue,
      bodyHtml: item.body_html,
      visitorEmail: item.external_contact_reply_email,
    };
  });

  const names = new Map<string, string>();
  if (sender) names.set(sender.id, formatProfileSnakeSurnameFirst(sender));
  const followUps = await loadAdminMessageFollowUpFacts(
    supabase,
    [row.id],
    names,
    dict.common.emptyValue,
  );
  const reply = matchLatestStaffAnswer({
    inboundId: row.id,
    inboundSenderId: row.sender_id,
    inboundCreatedAt: row.created_at,
    source,
    visitorEmail,
    candidates,
    includeHtml: true,
  });
  const safeHtml = reply?.html ? sanitizeMessageHtml(reply.html) : "";
  const lines = buildAdminMessageStatusStack({
    readAt: row.read_at,
    reply: reply ? { ...reply, html: safeHtml || undefined } : null,
    followUps: followUps.get(row.id) ?? [],
  });

  const [{ templates }, brand] = await Promise.all([
    loadMessagingDefaultReplyTemplate(supabase, MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES),
    getBrandForRequest(),
  ]);
  const body = resolveMessagingDefaultReplyPlain({
    template: pickMessagingDefaultReplyTemplate(templates, locale),
    instituteName: brand.name,
    phone: brand.contactPhone,
  });
  const fromName =
    source === "contact_form"
      ? (resolveSiteContactVisitorDisplayName({
          external_contact_display_name: row.external_contact_display_name,
          body_html: row.body_html,
        }) ?? dict.common.emptyValue)
      : sender
        ? formatProfileSnakeSurnameFirst(sender)
        : dict.common.emptyValue;
  const country = resolveWhatsAppCountry(brand.contactPhone);
  const email =
    source === "contact_form"
      ? visitorEmail
      : ((await batchAuthEmailsForUserIds([row.sender_id])).get(row.sender_id) ?? null);
  const digits =
    source === "contact_form"
      ? resolveContactWhatsAppDigits(row.body_html, country)
      : resolveWhatsAppDigits(sender?.phone, country);

  return {
    lines,
    hrefs: buildAdminMessageContactHrefs({
      email,
      whatsAppDigits: digits,
      subject: fillName(dict.admin.messages.contactSubject, fromName),
      body,
    }),
  };
}
