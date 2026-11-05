import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { hashSeatHoldToken } from "@/lib/events/seatHoldToken";
import { isEventSeatMapActive, purchasableSeatKeys } from "@/lib/events/seatMapState";
import {
  holdEventSeats,
  releaseEventSeatHolds,
} from "@/lib/events/server/eventSeatHoldsServer";
import {
  PRIVATE_NO_STORE,
  clientIp,
  isSeatRequestLimited,
} from "@/lib/events/server/eventSeatRequestLimit";
import { logServerException, logServerWarn } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

async function loadSeatEvent(slug: string, locale: string) {
  const supabase = await createClient();
  const event = await loadEventForPublicLanding(supabase, slug, locale);
  if (!event || !isEventSeatMapActive(event.seatMapConfig)) return null;
  return event;
}

function tokenFrom(request: Request, bodyToken?: unknown): string | null {
  const header = request.headers.get("x-seat-hold-token");
  const raw = header?.trim() || (typeof bodyToken === "string" ? bodyToken : "");
  return hashSeatHoldToken(raw);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    if (isSeatRequestLimited(clientIp(request))) {
      return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429, headers: PRIVATE_NO_STORE });
    }
    const { slug } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      locale?: string;
      token?: string;
      seatKeys?: unknown;
    } | null;
    const locale = body?.locale?.trim() || "es";
    const event = await loadSeatEvent(slug, locale);
    if (!event?.seatMapConfig) {
      return NextResponse.json({ ok: false, code: "event_not_found" }, { status: 404, headers: PRIVATE_NO_STORE });
    }
    const tokenHash = tokenFrom(request, body?.token);
    if (!tokenHash) {
      return NextResponse.json({ ok: false, code: "invalid_token" }, { status: 400, headers: PRIVATE_NO_STORE });
    }
    const requested = Array.isArray(body?.seatKeys)
      ? body.seatKeys.filter((item): item is string => typeof item === "string")
      : [];
    const allowed = purchasableSeatKeys(event.seatMapConfig);
    const seatKeys = [...new Set(requested.map((key) => key.trim()).filter(Boolean))];
    const invalid = seatKeys.filter((key) => !allowed.has(key));
    if (invalid.length > 0) {
      return NextResponse.json(
        { ok: false, code: "invalid_seat", takenSeatKeys: invalid },
        { status: 400, headers: PRIVATE_NO_STORE },
      );
    }
    const maxSeats = event.allowMultipleTickets ? (event.maxTicketsPerRegistration ?? 50) : 1;
    const held = await holdEventSeats(await createAdminClient(), {
      eventId: event.id,
      tokenHash,
      seatKeys,
      maxSeats,
    });
    if (!held.ok) {
      return NextResponse.json({ ok: false, code: held.code }, { status: 409, headers: PRIVATE_NO_STORE });
    }
    if (held.taken.length > 0) {
      await logServerWarn("events.seats.conflict", {
        eventId: event.id,
        source: "hold",
        seatCount: held.taken.length,
      });
    }
    return NextResponse.json(
      { ok: true, held: held.held, takenSeatKeys: held.taken, expiresAt: held.expiresAt },
      { headers: PRIVATE_NO_STORE },
    );
  } catch (error) {
    logServerException("api/events/seats/hold", error);
    return NextResponse.json({ ok: false, code: "server_error" }, { status: 500, headers: PRIVATE_NO_STORE });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const locale = new URL(request.url).searchParams.get("locale")?.trim() || "es";
    const event = await loadSeatEvent(slug, locale);
    if (!event) {
      return NextResponse.json({ ok: false, code: "event_not_found" }, { status: 404, headers: PRIVATE_NO_STORE });
    }
    const tokenHash = tokenFrom(request);
    if (!tokenHash) {
      return NextResponse.json({ ok: false, code: "invalid_token" }, { status: 400, headers: PRIVATE_NO_STORE });
    }
    await releaseEventSeatHolds(await createAdminClient(), { eventId: event.id, tokenHash });
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE });
  } catch (error) {
    logServerException("api/events/seats/hold.delete", error);
    return NextResponse.json({ ok: false, code: "server_error" }, { status: 500, headers: PRIVATE_NO_STORE });
  }
}
