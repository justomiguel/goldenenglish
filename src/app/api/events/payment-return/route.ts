import { NextResponse } from "next/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import {
  normalizeEventPaymentBannerStatus,
  type EventPaymentReturnStatus,
} from "@/lib/events/buildEventPaymentReturnUrl";
import {
  reconcileEventFlowReturn,
  reconcileEventMercadoPagoReturn,
} from "@/lib/events/server/reconcileEventGatewayPaymentReturn";
import { logServerException } from "@/lib/logging/serverActionLog";

/**
 * Return bridge for public event gateway payments.
 *
 * - MercadoPago Checkout Pro sends the payer here via GET (back_urls).
 * - Flow sends the payer here via POST (urlReturn, application/x-www-form-urlencoded).
 *
 * Both are 303-redirected to the localized public event page with a `?payment=<status>`
 * banner. When gateway identifiers are present, we finalize the payment here as well
 * (webhook/confirm remain the authoritative backup).
 */
function firstParam(raw: string | null): string {
  return raw?.trim() ?? "";
}

async function resolveBannerStatus(req: Request, fallbackStatus: string | null): Promise<EventPaymentReturnStatus> {
  const url = new URL(req.url);
  const normalizedFallback =
    normalizeEventPaymentBannerStatus(fallbackStatus) ?? "processing";

  if (req.method === "POST") {
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const token = firstParam(params.get("token"));
    if (!token) {
      return normalizedFallback;
    }
    return reconcileEventFlowReturn({ token });
  }

  const mpPaymentId = firstParam(
    url.searchParams.get("payment_id") ?? url.searchParams.get("collection_id"),
  );
  const externalReference = firstParam(url.searchParams.get("external_reference"));
  const returnStatus = firstParam(
    url.searchParams.get("collection_status") ?? url.searchParams.get("status"),
  );

  if (!mpPaymentId && !externalReference) {
    return normalizedFallback;
  }

  return reconcileEventMercadoPagoReturn({
    mpPaymentId,
    externalReference,
    returnStatus,
  });
}

async function buildRedirect(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const localeRaw = (url.searchParams.get("locale") ?? "es").trim();
  const locale = localeRaw === "en" || localeRaw === "pt" ? localeRaw : "es";
  const slug = (url.searchParams.get("slug") ?? "").trim();
  const bridgeStatus = url.searchParams.get("status");
  const status = await resolveBannerStatus(req, bridgeStatus);

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
    return await buildRedirect(req);
  } catch (e) {
    logServerException("eventPaymentReturn:GET", e);
    return new Response("error", { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    return await buildRedirect(req);
  } catch (e) {
    logServerException("eventPaymentReturn:POST", e);
    return new Response("error", { status: 500 });
  }
}
