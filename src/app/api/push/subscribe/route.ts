import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const bodySchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "invalid_input" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: parsed.data.endpoint,
        keys_p256dh: parsed.data.keys.p256dh,
        keys_auth: parsed.data.keys.auth,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" },
    );

    if (error) {
      logSupabaseClientError("api/push/subscribe:upsert", error, { userId: user.id });
      return NextResponse.json({ ok: false, code: "persist_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true as const }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    logServerException("api/push/subscribe", err);
    return NextResponse.json({ ok: false, code: "server_error" }, { status: 500 });
  }
}
