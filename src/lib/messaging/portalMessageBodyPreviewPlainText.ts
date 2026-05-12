import { stripHtmlToText } from "@/lib/messaging/stripHtml";

const FIRST_HR = /<hr\b[^>]*>/i;

/**
 * Plain-text snippet for portal message lists and notifications.
 * Public-site contact HTML prefixes subject/meta lines before `<hr />`; only content after the first HR counts as body for previews.
 */
export function portalMessageBodyPreviewPlainText(html: string, maxLen = 120): string {
  const raw = String(html ?? "");
  const segments = raw.split(FIRST_HR);
  const bodyHtml = segments.length > 1 ? segments.slice(1).join("") : raw;
  const text = stripHtmlToText(bodyHtml);
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
