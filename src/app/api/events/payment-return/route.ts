import { NextResponse } from "next/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { normalizeEventPaymentBannerStatus } from "@/lib/events/buildEventPaymentReturnUrl";
import { logServerException } from "@/lib/logging/serverActionLog";

/**
 * Return bridge for public event gateway payments.
 *
 * - MercadoPago Checkout Pro sends the payer here via GET (back_urls).
 * - Flow sends the payer here via POST (urlReturn, application/x-www-form-urlencoded).
 *
 * Both are 303-redirected to the localized public event page with a `?payment=<status>`
 * banner. Authoritative confirmation happens out-of-band (MP webhook / Flow confirm),
 * so this bridge only drives UX, never trusts these params for payment state.
 */
function buildRedirect(req: Request): Response {
  const url = new URL(req.url);
  const localeRaw = (url.searchParams.get("locale") ?? "es").trim();
  const locale = localeRaw === "en" || localeRaw === "pt" ? localeRaw : "es";
  const slug = (url.searchParams.get("slug") ?? "").trim();
  const status = normalizeEventPaymentBannerStatus(url.searchParams.get("status")) ?? "processing";

  const base = getPublicSiteUrl();
  if (!base || !slug) {
    return new Response("misconfigured", { status: 502 });
  }

  const dest = new URL(`/${locale}/events/${encodeURIComponent(slug)}`, base);
  dest.searchParams.set("payment", status);

  const res = NextResponse.redirect(dest.toString(), 303);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function GET(req: Request): Promise<Response> {
  try {
    return buildRedirect(req);
  } catch (e) {
    logServerException("eventPaymentReturn:GET", e);
    return new Response("error", { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    return buildRedirect(req);
  } catch (e) {
    logServerException("eventPaymentReturn:POST", e);
    return new Response("error", { status: 500 });
  }
}
