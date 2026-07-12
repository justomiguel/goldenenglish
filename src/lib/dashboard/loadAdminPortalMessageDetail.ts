import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { collapseRichTextDisplayHtml } from "@/lib/learning-tasks/collapseRichTextDisplayHtml";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { portalMessageRoleDisplay } from "@/lib/dashboard/portalMessageRoleDisplay";
import { portalMessageBodyPreviewPlainText } from "@/lib/messaging/portalMessageBodyPreviewPlainText";
import { isAdministrationBoundAdminInbound } from "@/lib/messaging/isAdministrationBoundAdminInbound";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveSiteContactVisitorDisplayName } from "@/lib/messaging/siteContactVisitorDisplayName";
import { adminPortalMessageSource } from "@/lib/messaging/adminPortalMessageSource";
import type { AdminPortalMessageSource } from "@/lib/messaging/adminPortalMessageSource";

export type AdminPortalMessageDetailModel = {
  id: string;
  createdAt: string;
  bodyHtmlDisplay: string;
  previewSnippet: string;
  fromName: string;
  toName: string;
  fromRoleLabel: string;
  toRoleLabel: string;
  source: AdminPortalMessageSource;
};

export async function loadAdminPortalMessageDetail(
  supabase: SupabaseClient,
  dict: Dictionary,
  messageId: string,
): Promise<AdminPortalMessageDetailModel | null> {
  const { data: row, error: rowErr } = await supabase
    .from("portal_messages")
    .select(
      "id, sender_id, recipient_id, body_html, created_at, broadcast_batch_id, external_contact_display_name",
    )
    .eq("id", messageId)
    .maybeSingle();

  if (rowErr) {
    logSupabaseClientError("loadAdminPortalMessageDetail:portal_messages", rowErr, {
      messageId,
    });
    return null;
  }
  if (!row) return null;

  const senderId = row.sender_id as string;
  const recipientId = row.recipient_id as string;

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .in("id", [senderId, recipientId]);

  if (profErr) {
    logSupabaseClientError("loadAdminPortalMessageDetail:profiles", profErr, {
      messageId,
    });
    return null;
  }

  const metaById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        name: formatProfileSnakeSurnameFirst(p),
        role: (p.role as string) ?? "",
      },
    ]),
  );

  const s = metaById.get(senderId);
  const r = metaById.get(recipientId);
  const adminBound = isAdministrationBoundAdminInbound({
    broadcastBatchId: (row.broadcast_batch_id as string | null | undefined) ?? null,
    senderRole: s?.role ?? "",
  });

  const rawHtml = row.body_html as string;
  const previewSnippet = portalMessageBodyPreviewPlainText(rawHtml, 240);
  const bodyHtmlDisplay = collapseRichTextDisplayHtml(sanitizeMessageHtml(rawHtml));

  let fromName = s?.name ?? dict.common.emptyValue;
  if (s?.role === "site_contact") {
    const visitor = resolveSiteContactVisitorDisplayName({
      external_contact_display_name:
        (row.external_contact_display_name as string | null | undefined) ?? null,
      body_html: rawHtml,
    });
    if (visitor) fromName = visitor;
  }

  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    bodyHtmlDisplay,
    previewSnippet,
    fromName,
    toName: adminBound
      ? dict.admin.messages.administrationPeerLabel
      : (r?.name ?? dict.common.emptyValue),
    fromRoleLabel: portalMessageRoleDisplay(dict, s?.role ?? ""),
    toRoleLabel: portalMessageRoleDisplay(dict, r?.role ?? ""),
    source: adminPortalMessageSource(s?.role ?? ""),
  };
}
