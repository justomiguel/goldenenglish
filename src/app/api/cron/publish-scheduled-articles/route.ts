import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";
import { publishScheduledArticles } from "@/lib/blog/server";
import { logServerException } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await publishScheduledArticles(admin);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    logServerException("api/cron/publish-scheduled-articles", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
