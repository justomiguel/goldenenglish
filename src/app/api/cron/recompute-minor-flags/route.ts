import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const qSecret = url.searchParams.get("secret");
  const ok =
    secret &&
    (auth === `Bearer ${secret}` ||
      request.headers.get("x-cron-secret") === secret ||
      qSecret === secret);
  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false, message: "No admin client" }, { status: 500 });
  }

  const { error } = await admin.rpc("profiles_recompute_minor_flags");
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
