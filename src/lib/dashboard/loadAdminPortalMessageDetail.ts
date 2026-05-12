import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { collapseRichTextDisplayHtml } from "@/lib/learning-tasks/collapseRichTextDisplayHtml";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";
import { portalMessageRoleDisplay } from "@/lib/dashboard/portalMessageRoleDisplay";
import { portalMessageBodyPreviewPlainText } from "@/lib/messaging/portalMessageBodyPreviewPlainText";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type AdminPortalMessageDetailModel = {
  id: string;
  createdAt: string;
  bodyHtmlDisplay: string;
  previewSnippet: string;
  fromName: string;
  toName: string;
  fromRoleLabel: string;
  toRoleLabel: string;
};

export async function loadAdminPortalMessageDetail(
  supabase: SupabaseClient,
  dict: Dictionary,
  messageId: string,
): Promise<AdminPortalMessageDetailModel | null> {
  const { data: row, error: rowErr } = await supabase
    .from("portal_messages")
    .select("id, sender_id, recipient_id, body_html, created_at")
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

  const rawHtml = row.body_html as string;
  const previewSnippet = portalMessageBodyPreviewPlainText(rawHtml, 240);
  const bodyHtmlDisplay = collapseRichTextDisplayHtml(sanitizeMessageHtml(rawHtml));

  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    bodyHtmlDisplay,
    previewSnippet,
    fromName: s?.name ?? dict.common.emptyValue,
    toName: r?.name ?? dict.common.emptyValue,
    fromRoleLabel: portalMessageRoleDisplay(dict, s?.role ?? ""),
    toRoleLabel: portalMessageRoleDisplay(dict, r?.role ?? ""),
  };
}
