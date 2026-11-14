import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { logServerActionException } from "@/lib/logging/serverActionLog";
import { enrollmentPayReturnPath } from "@/lib/register/enrollmentPayReturnResult";
import { reconcileEnrollmentPayReturn } from "@/lib/register/reconcileEnrollmentPayReturn";

function first(raw: string | null): string {
  return raw?.trim() ?? "";
}

async function finish(req: Request, flowToken: string): Promise<Response> {
  const url = new URL(req.url);
  const payToken = first(url.searchParams.get("pay"));
  const base = await getRequestPublicSiteUrl();
  if (!base || !payToken) {
    return new Response("misconfigured", { status: 502 });
  }
  const result = await reconcileEnrollmentPayReturn({
    admin: await createAdminClient(),
    flowToken,
    mpPaymentId: first(url.searchParams.get("payment_id") ?? url.searchParams.get("collection_id")),
    returnStatus: first(url.searchParams.get("collection_status") ?? url.searchParams.get("status")),
    country: first(url.searchParams.get("country")),
  });
  const dest = new URL(
    enrollmentPayReturnPath({
      locale: first(url.searchParams.get("locale")) || "es",
      slug: first(url.searchParams.get("slug")) || "pago",
      payToken,
      result,
    }),
    base,
  );
  const res = NextResponse.redirect(dest, 303);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function GET(req: Request): Promise<Response> {
  try {
    return await finish(req, "");
  } catch (error) {
    await logServerActionException("enrollmentPayReturn:GET", error);
    return new Response("error", { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const raw = await req.text();
    const token = first(new URLSearchParams(raw).get("token"));
    return await finish(req, token);
  } catch (error) {
    await logServerActionException("enrollmentPayReturn:POST", error);
    return new Response("error", { status: 500 });
  }
}
