import { expect, type APIRequestContext } from "@playwright/test";

export type RecordedEmail = {
  to: string;
  subject: string;
  html: string;
};

export async function clearRecordedEmails(request: APIRequestContext): Promise<void> {
  const res = await request.delete("/api/e2e/recorded-emails");
  expect(res.ok(), `DELETE recorded-emails → ${res.status()}`).toBeTruthy();
}

export async function fetchRecordedEmails(
  request: APIRequestContext,
): Promise<RecordedEmail[]> {
  const res = await request.get("/api/e2e/recorded-emails");
  expect(res.ok(), `GET recorded-emails → ${res.status()}`).toBeTruthy();
  const body = (await res.json()) as { ok?: boolean; emails?: RecordedEmail[] };
  expect(body.ok).toBe(true);
  return body.emails ?? [];
}

/** Decode common HTML entities used in recorded email href attributes. */
export function decodeHtmlHref(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Pull the first recovery / reset action URL from recorded email HTML.
 * Prefers hrefs that look like Supabase verify or app recovery-callback links.
 */
export function extractResetUrlFromHtml(html: string): string | null {
  const decoded = decodeHtmlHref(html);
  const hrefs = [...decoded.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]!);
  const preferred = hrefs.find((h) =>
    /recovery|verify|token_hash|type=recovery|reset-password|recovery-callback/i.test(h),
  );
  return preferred ?? hrefs[0] ?? null;
}
