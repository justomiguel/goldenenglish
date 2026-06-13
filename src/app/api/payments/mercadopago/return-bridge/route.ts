import { NextResponse } from "next/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";

/**
 * MercadoPago redirects the payer here after Checkout Pro (GET with query params).
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const localeParam = (url.searchParams.get("locale") ?? "en").trim().slice(0, 8);
    const localeRaw = localeParam === "es" || localeParam === "en" ? localeParam : "en";
    const dashboard = url.searchParams.get("dashboard") === "parent" ? "parent" : "student";
    const status = url.searchParams.get("status") ?? url.searchParams.get("collection_status") ?? "";
    const externalReference = url.searchParams.get("external_reference") ?? "";
    const paymentId = url.searchParams.get("payment_id") ?? url.searchParams.get("collection_id") ?? "";

    const base = getPublicSiteUrl();
    if (!base) {
      return new Response("misconfigured", { status: 502 });
    }

    const dest = new URL("/api/payments/mercadopago/return-reconcile", base);
    dest.searchParams.set("locale", localeRaw);
    dest.searchParams.set("dashboard", dashboard);
    if (status) dest.searchParams.set("status", status);
    if (externalReference) dest.searchParams.set("external_reference", externalReference);
    if (paymentId) dest.searchParams.set("payment_id", paymentId);
    const country = url.searchParams.get("country");
    if (country) dest.searchParams.set("country", country);

    const res = NextResponse.redirect(dest.toString(), 303);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    logServerException("mpReturnBridge:GET", e);
    return new Response("error", { status: 500 });
  }
}
