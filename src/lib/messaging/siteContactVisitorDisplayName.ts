import { stripHtmlToText } from "@/lib/messaging/stripHtml";

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

/**
 * Legacy contact-form rows: first meta value in the header (before `<hr />`)
 * that is not an email and not the subject-only short token when followed by email lines.
 * Heuristic: take the first non-empty line value after a label that looks like a name field,
 * else the first non-email meta value that is longer than a single subject word group.
 */
export function extractSiteContactVisitorNameFromPortalHtml(html: string): string | null {
  const hrIdx = html.search(/<hr\s*\/?>/i);
  const head = hrIdx >= 0 ? html.slice(0, hrIdx) : html;
  const paragraphs = [...head.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1] ?? "");

  const values: string[] = [];
  for (const raw of paragraphs) {
    const strongMatch = raw.match(/<strong[^>]*>([\s\S]*?)<\/strong>\s*([\s\S]*)/i);
    if (!strongMatch) continue;
    const value = stripHtmlToText(strongMatch[2] ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (value && value !== "—") values.push(value);
  }

  const nonEmail = values.filter((v) => !EMAIL_RE.test(v));
  // Skip subject line when we have a clearer name candidate later (subject is usually first).
  if (nonEmail.length >= 2) {
    const nameCandidate = nonEmail[1]!;
    if (nameCandidate.length >= 2) return nameCandidate;
  }
  const first = nonEmail[0];
  return first && first.length >= 2 ? first : null;
}

export function resolveSiteContactVisitorDisplayName(row: {
  external_contact_display_name: string | null | undefined;
  body_html: string;
}): string | null {
  const col = row.external_contact_display_name?.trim();
  if (col) return col;
  return extractSiteContactVisitorNameFromPortalHtml(row.body_html);
}
