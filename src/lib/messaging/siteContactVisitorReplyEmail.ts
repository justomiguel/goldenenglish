import { z } from "zod";
import { stripHtmlToText } from "@/lib/messaging/stripHtml";

/** Pull first RFC-looking email from the HTML header block before `<hr />` (legacy rows). */
export function extractSiteContactVisitorEmailFromPortalHtml(html: string): string | null {
  const hrIdx = html.search(/<hr\s*\/?>/i);
  const head = hrIdx >= 0 ? html.slice(0, hrIdx) : html;
  const text = stripHtmlToText(head);
  const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (!match?.[0]) return null;
  const candidate = match[0];
  return z.string().email().safeParse(candidate).success ? candidate : null;
}

export function resolveSiteContactVisitorReplyEmail(row: {
  external_contact_reply_email: string | null | undefined;
  body_html: string;
}): string | null {
  const col = row.external_contact_reply_email?.trim();
  if (col && z.string().email().safeParse(col).success) return col;
  return extractSiteContactVisitorEmailFromPortalHtml(row.body_html);
}
