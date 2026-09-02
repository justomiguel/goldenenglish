import { decodeHtmlHref } from "./recordedEmails";

export function extractMatriculaUrlFromHtml(html: string): string | null {
  const decoded = decodeHtmlHref(html);
  const hrefs = [...decoded.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]!);
  return hrefs.find((h) => /\/matricula\/[a-z0-9]+/i.test(h)) ?? null;
}
