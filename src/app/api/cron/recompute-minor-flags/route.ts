import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logServerException("api/cron/recompute-minor-flags:createAdminClient", err);
    return NextResponse.json({ ok: false, message: "no_admin_client" }, { status: 500 });
  }

  const { error } = await admin.rpc("profiles_recompute_minor_flags");
  if (error) {
    logSupabaseClientError("api/cron/recompute-minor-flags:rpc", error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
