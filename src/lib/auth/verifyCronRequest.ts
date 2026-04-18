/**
 * Authenticates Vercel-style cron / scheduler invocations.
 *
 * Accepts the secret **only** through server-controlled headers:
 *
 *  - `Authorization: Bearer <CRON_SECRET>` (Vercel Cron canonical form)
 *  - `x-cron-secret: <CRON_SECRET>`        (private scheduler convention)
 *
 * The secret is **never** read from the URL query string: query params leak via
 * Referer headers, browser history, proxy / CDN access logs and outbound link
 * sharing. See OWASP A05 / A07 — and the audit notes added with this change.
 *
 * Returns `true` only when `CRON_SECRET` is set (non-empty) and at least one
 * accepted header matches it exactly.
 */
export function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const xCron = request.headers.get("x-cron-secret");
  if (xCron === secret) return true;

  return false;
}
