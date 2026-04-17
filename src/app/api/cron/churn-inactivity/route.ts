import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStudentChurnAlert } from "@/lib/email/churnInactivityEmail";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const DEFAULT_LOCALE = "es";

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
    logServerException("api/cron/churn-inactivity:createAdminClient", err);
    return NextResponse.json({ ok: false, message: "no_admin_client" }, { status: 500 });
  }

  const BATCH_LIMIT = 100;
  const { data: candidates, error } = await admin
    .from("profiles")
    .select("id, first_name, last_name, last_session_start_at, churn_notified_at")
    .eq("role", "student")
    .not("last_session_start_at", "is", null)
    .lt("last_session_start_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .is("churn_notified_at", null)
    .order("last_session_start_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    logSupabaseClientError("api/cron/churn-inactivity:profilesSelect", error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const row of candidates ?? []) {
    const id = row.id as string;
    const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
    try {
      await sendStudentChurnAlert({
        studentId: id,
        locale: DEFAULT_LOCALE,
        studentDisplayName: name,
      });
      await admin
        .from("profiles")
        .update({ churn_notified_at: new Date().toISOString() })
        .eq("id", id);
      sent += 1;
    } catch (loopErr) {
      logServerException("api/cron/churn-inactivity:notifyStudent", loopErr, { studentId: id });
    }
  }

  return NextResponse.json({ ok: true, notified: sent });
}
