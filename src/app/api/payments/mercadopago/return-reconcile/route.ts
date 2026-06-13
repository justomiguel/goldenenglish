import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveMercadoPagoMonthlyPaymentReturnPage } from "@/lib/billing/resolveMercadoPagoMonthlyPaymentReturnPage";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";

function firstParam(raw: string | null): string | undefined {
  const v = raw?.trim();
  return v || undefined;
}

/**
 * MercadoPago return bridge lands here first so payment finalize + revalidatePath
 * run in a route handler (not during RSC render).
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const localeParam = (url.searchParams.get("locale") ?? "en").trim().slice(0, 8);
    const locale = localeParam === "es" || localeParam === "en" ? localeParam : "en";
    const dashboard = url.searchParams.get("dashboard") === "parent" ? "parent" : "student";
    const expectedRole = dashboard === "parent" ? "parent" : "student";

    const base = getPublicSiteUrl();
    if (!base) {
      return new Response("misconfigured", { status: 502 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const login = new URL(`/${locale}/login`, base);
      login.searchParams.set("next", `${url.pathname}${url.search}`);
      const res = NextResponse.redirect(login.toString(), 303);
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== expectedRole) {
      const res = NextResponse.redirect(new URL(`/${locale}/dashboard`, base).toString(), 303);
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    }

    await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase,
      allowFinalize: true,
      externalReference: firstParam(
        url.searchParams.get("external_reference") ?? url.searchParams.get("payment_id"),
      ),
      mpPaymentId: firstParam(url.searchParams.get("payment_id") ?? url.searchParams.get("collection_id")),
      returnStatus: firstParam(url.searchParams.get("status") ?? url.searchParams.get("collection_status")),
      countryCode: firstParam(url.searchParams.get("country")),
    });

    const dest = new URL(`/${locale}/dashboard/${dashboard}/payments/mp-return`, base);
    for (const key of ["status", "collection_status", "external_reference", "payment_id", "collection_id", "country"] as const) {
      const value = url.searchParams.get(key);
      if (value) dest.searchParams.set(key, value);
    }

    const res = NextResponse.redirect(dest.toString(), 303);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    logServerException("mpReturnReconcile:GET", e);
    return new Response("error", { status: 500 });
  }
}
