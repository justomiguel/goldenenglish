import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { hashSeatHoldToken } from "@/lib/events/seatHoldToken";
import { isEventSeatMapActive } from "@/lib/events/seatMapState";
import { loadEventSeatLocks } from "@/lib/events/server/eventSeatLocksServer";
import { loadEventSeatHoldRows } from "@/lib/events/server/eventSeatHoldsServer";
import {
  PRIVATE_NO_STORE,
  clientIp,
  isSeatRequestLimited,
} from "@/lib/events/server/eventSeatRequestLimit";
import { logServerException } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    if (isSeatRequestLimited(clientIp(request))) {
      return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429, headers: PRIVATE_NO_STORE });
    }
    const { slug } = await context.params;
    const locale = new URL(request.url).searchParams.get("locale")?.trim() || "es";
    const supabase = await createClient();
    const event = await loadEventForPublicLanding(supabase, slug, locale);
    if (!event || !isEventSeatMapActive(event.seatMapConfig)) {
      return NextResponse.json({ ok: false, code: "event_not_found" }, { status: 404, headers: PRIVATE_NO_STORE });
    }
    const tokenHash = hashSeatHoldToken(request.headers.get("x-seat-hold-token"));
    const admin = await createAdminClient();
    const [locks, holds] = await Promise.all([
      loadEventSeatLocks(admin, event.id),
      loadEventSeatHoldRows(admin, event.id, tokenHash),
    ]);
    return NextResponse.json(
      {
        ok: true,
        locks,
        heldByOthers: holds.heldByOthers,
        myHolds: holds.myHolds,
        expiresAt: holds.expiresAt,
      },
      { headers: PRIVATE_NO_STORE },
    );
  } catch (error) {
    logServerException("api/events/seats", error);
    return NextResponse.json({ ok: false, code: "server_error" }, { status: 500, headers: PRIVATE_NO_STORE });
  }
}
