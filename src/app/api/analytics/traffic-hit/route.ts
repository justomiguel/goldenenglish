import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clientIpFromHeaders,
  insertTrafficPageHit,
} from "@/lib/analytics/recordTrafficPageHitServer";
import { createClient } from "@/lib/supabase/server";
import { logServerException } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const bodySchema = z.object({
  pathname: z
    .string()
    .min(1)
    .max(2048)
    .refine((s) => s.startsWith("/") && !s.includes(".."), "invalid path"),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch (err) {
    logServerException("api/analytics/traffic-hit:json", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  const get = (n: string) => request.headers.get(n);
  const inserted = await insertTrafficPageHit({
    pathname: parsed.data.pathname,
    userAgent: get("user-agent"),
    userId: user?.id ?? null,
    referrer: get("referer"),
    geoCountry: get("x-vercel-ip-country"),
    geoRegion: get("x-vercel-ip-country-region"),
    clientIp: clientIpFromHeaders(get),
  });
  if (!inserted.ok) {
    const msg = inserted.error.message;
    if (msg === "server_misconfigured") {
      return NextResponse.json({ ok: false, message: "server_misconfigured" }, { status: 503 });
    }
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
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
