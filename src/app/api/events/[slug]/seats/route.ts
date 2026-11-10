import { NextResponse } from "next/server";
import { openPublishedEvent } from "@/lib/events/server/openPublishedEvent";
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
    const source = await openPublishedEvent(slug, locale);
    const event = source?.event ?? null;
    if (!event || !source || !isEventSeatMapActive(event.seatMapConfig)) {
      return NextResponse.json({ ok: false, code: "event_not_found" }, { status: 404, headers: PRIVATE_NO_STORE });
    }
    const tokenHash = hashSeatHoldToken(request.headers.get("x-seat-hold-token"));
    const admin = source.client;
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
