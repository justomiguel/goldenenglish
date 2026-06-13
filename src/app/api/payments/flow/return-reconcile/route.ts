import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveFlowMonthlyPaymentReturnPage } from "@/lib/billing/resolveFlowMonthlyPaymentReturnPage";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";

/**
 * Flow return bridge lands here first so payment finalize + revalidatePath
 * run in a route handler (not during RSC render).
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const localeParam = (url.searchParams.get("locale") ?? "en").trim().slice(0, 8);
    const locale = localeParam === "es" || localeParam === "en" ? localeParam : "en";
    const dashboard = url.searchParams.get("dashboard") === "parent" ? "parent" : "student";
    const expectedRole = dashboard === "parent" ? "parent" : "student";
    const token = url.searchParams.get("token")?.trim() ?? "";

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

    await resolveFlowMonthlyPaymentReturnPage({
      supabase,
      allowFinalize: true,
      token: token || undefined,
    });

    const dest = new URL(`/${locale}/dashboard/${dashboard}/payments/flow-return`, base);
    if (token) dest.searchParams.set("token", token);

    const res = NextResponse.redirect(dest.toString(), 303);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    logServerException("flowReturnReconcile:GET", e);
    return new Response("error", { status: 500 });
  }
}
