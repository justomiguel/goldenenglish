import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";
import { deleteExpiredEventSeatHolds } from "@/lib/events/server/eventSeatHoldsServer";
import { logServerException } from "@/lib/logging/serverActionLog";
import { runCronAcrossTenants } from "@/lib/tenant/runCronAcrossTenants";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return runCronAcrossTenants(async () => {
    try {
      const removed = await deleteExpiredEventSeatHolds(await createAdminClient());
      return NextResponse.json({ ok: true, removed });
    } catch (error) {
      logServerException("api/cron/event-seat-holds-cleanup", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  });
}
