import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";
import { notifyAttendeeViaResend } from "@/lib/events/server/notifyAttendeeViaResend";
import { logServerException } from "@/lib/logging/serverActionLog";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: attendees } = await admin
      .from("event_attendees")
      .select("id, email, event_id, events!inner(event_date)")
      .in("status", ["confirmed", "pending_payment"])
      .gte("events.event_date", now.toISOString())
      .lte("events.event_date", until.toISOString())
      .limit(500);

    let sent = 0;
    for (const attendee of attendees ?? []) {
      const ok = await notifyAttendeeViaResend({
        to: String(attendee.email),
        templateKey: "events.reminder",
        locale: "es",
      });
      if (ok) sent += 1;
    }

    return NextResponse.json({ ok: true, sent, total: (attendees ?? []).length });
  } catch (error) {
    logServerException("api/cron/event-reminders", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
