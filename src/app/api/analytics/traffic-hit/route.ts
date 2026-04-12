import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyTrafficVisitor } from "@/lib/analytics/classifyTrafficVisitor";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { anonymizeIp } from "@/lib/analytics/sanitizeMetadata";

export const runtime = "nodejs";

const bodySchema = z.object({
  pathname: z
    .string()
    .min(1)
    .max(2048)
    .refine((s) => s.startsWith("/") && !s.includes(".."), "invalid path"),
});

function clientIpFromRequest(request: Request): string | null {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    return first || null;
  }
  return request.headers.get("x-real-ip");
}

function truncate(s: string | null, max: number): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}...`;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ua = request.headers.get("user-agent") ?? "";
  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  const kind = classifyTrafficVisitor(ua, user?.id ?? null);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false, message: "server_misconfigured" }, { status: 503 });
  }

  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  const rawIp = clientIpFromRequest(request);
  const ip = anonymizeIp(rawIp);

  const { error } = await admin.from("traffic_page_hits").insert({
    visitor_kind: kind,
    user_id: user?.id ?? null,
    pathname: parsed.data.pathname,
    referrer: truncate(request.headers.get("referer"), 400),
    user_agent: truncate(ua, 600),
    geo_country: country?.trim() || null,
    geo_region: region?.trim() || null,
    client_ip: ip,
  });

  if (error) {
    const msg = error.message ?? "";
    const missingRelation =
      msg.includes("traffic_page_hits") &&
      (msg.includes("does not exist") ||
        msg.includes("schema cache") ||
        /not\s+find.*traffic_page_hits/i.test(msg));
    if (missingRelation) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "traffic_page_hits is missing — apply Supabase migration 013_traffic_page_hits.sql",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
