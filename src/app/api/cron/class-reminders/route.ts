import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncClassReminderJobs } from "@/lib/notifications/syncClassReminderJobs";
import { dispatchClassReminderJobs } from "@/lib/notifications/dispatchClassReminderJobs";
import { logServerException } from "@/lib/logging/serverActionLog";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
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
