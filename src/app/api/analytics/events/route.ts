import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { anonymizeIp, sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitizeMetadata";

export const runtime = "nodejs";

const bodySchema = z.object({
  events: z
    .array(
      z.object({
        event_type: z.enum(["page_view", "click", "action", "session_start"]),
        entity: z.string().min(1).max(500),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
    .min(1)
    .max(40),
});

function clientIpFromRequest(request: Request): string | null {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    return first || null;
  }
  return request.headers.get("x-real-ip");
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  const rawIp = clientIpFromRequest(request);
  const ip = anonymizeIp(rawIp);

  const rows = parsed.data.events.map((e) => {
    const meta = sanitizeAnalyticsMetadata({
      ...(e.metadata ?? {}),
      ...(country ? { geo_country: country } : {}),
      ...(region ? { geo_region: region } : {}),
    });
    return {
      user_id: user.id,
      event_type: e.event_type,
      entity: e.entity,
      metadata: meta,
      client_ip: ip,
    };
  });

  const { error } = await supabase.from("user_events").insert(rows);
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
