import { NextResponse } from "next/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";

/**
 * Flow sends the payer here with POST (application/x-www-form-urlencoded, body token=…).
 * Next.js pages do not handle that POST; we 303-redirect to the localized GET flow-return screen.
 *
 * @see Flow order confirmation (urlReturn, POST + token)
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const localeParam = (url.searchParams.get("locale") ?? "en").trim().slice(0, 8);
    const localeRaw = localeParam === "es" || localeParam === "en" ? localeParam : "en";
    const dashboard = url.searchParams.get("dashboard") === "parent" ? "parent" : "student";

    const raw = await req.text();
    const body = new URLSearchParams(raw);
    const token = body.get("token")?.trim() ?? "";

    const base = getPublicSiteUrl();
    if (!base) {
      return new Response("misconfigured", { status: 502 });
    }

    const dest = new URL("/api/payments/flow/return-reconcile", base);
    dest.searchParams.set("locale", localeRaw);
    dest.searchParams.set("dashboard", dashboard);
    if (token) {
      dest.searchParams.set("token", token);
    }

    const res = NextResponse.redirect(dest.toString(), 303);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    logServerException("flowReturnBridge:POST", e);
    return new Response("error", { status: 500 });
  }
}
