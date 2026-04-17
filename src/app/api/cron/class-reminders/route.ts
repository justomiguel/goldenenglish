import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncClassReminderJobs } from "@/lib/notifications/syncClassReminderJobs";
import { dispatchClassReminderJobs } from "@/lib/notifications/dispatchClassReminderJobs";
import { logServerException } from "@/lib/logging/serverActionLog";

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
  } catch (err) {
    logServerException("api/cron/class-reminders:createAdminClient", err);
    return NextResponse.json({ ok: false, message: "no_admin_client" }, { status: 500 });
  }

  const sync = await syncClassReminderJobs(admin);
  const dispatch = await dispatchClassReminderJobs(admin);
  return NextResponse.json({ ok: true, sync, dispatch });
}
