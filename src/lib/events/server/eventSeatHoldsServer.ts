import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export const SEAT_HOLD_TTL_SECONDS = 600;

interface HoldRpcPayload {
  held?: unknown;
  taken?: unknown;
  expires_at?: string | null;
  code?: string;
  ok?: boolean;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function holdEventSeats(
  admin: SupabaseClient,
  input: {
    eventId: string;
    tokenHash: string;
    seatKeys: readonly string[];
    maxSeats: number;
  },
): Promise<
  | { ok: true; held: string[]; taken: string[]; expiresAt: string | null }
  | { ok: false; code: "hold_failed" | "too_many" | "invalid_token" }
> {
  const { data, error } = await admin.rpc("hold_event_seats", {
    p_event_id: input.eventId,
    p_token_hash: input.tokenHash,
    p_seat_keys: [...input.seatKeys],
    p_max_seats: input.maxSeats,
    p_ttl_seconds: SEAT_HOLD_TTL_SECONDS,
  });
  if (error) {
    logSupabaseClientError("events.seats.hold", error, { eventId: input.eventId });
    return { ok: false, code: "hold_failed" };
  }
  const payload = (data ?? {}) as HoldRpcPayload;
  if (payload.code === "too_many" || payload.code === "invalid_token") {
    logServerWarn("events.seats.hold", { eventId: input.eventId, code: payload.code });
    return { ok: false, code: payload.code };
  }
  return {
    ok: true,
    held: textList(payload.held),
    taken: textList(payload.taken),
    expiresAt: payload.expires_at ?? null,
  };
}

export async function releaseEventSeatHolds(
  admin: SupabaseClient,
  input: { eventId: string; tokenHash: string },
): Promise<void> {
  const { error } = await admin.rpc("release_event_seat_holds", {
    p_event_id: input.eventId,
    p_token_hash: input.tokenHash,
  });
  if (error) {
    logSupabaseClientError("events.seats.hold.release", error, { eventId: input.eventId });
  }
}

export async function claimEventSeats(
  admin: SupabaseClient,
  input: {
    eventId: string;
    attendeeId: string;
    tokenHash: string;
    seats: ReadonlyArray<{ seatKey: string; seatLabel: string }>;
  },
): Promise<{ ok: true } | { ok: false; code: "seat_already_taken" | "claim_failed"; taken: string[] }> {
  const { data, error } = await admin.rpc("claim_event_seats", {
    p_event_id: input.eventId,
    p_attendee_id: input.attendeeId,
    p_token_hash: input.tokenHash,
    p_seats: input.seats.map((seat) => ({ seat_key: seat.seatKey, seat_label: seat.seatLabel })),
  });
  if (error) {
    logSupabaseClientError("events.seats.claim", error, {
      eventId: input.eventId,
      attendeeId: input.attendeeId,
    });
    return { ok: false, code: "claim_failed", taken: input.seats.map((seat) => seat.seatKey) };
  }
  const payload = (data ?? {}) as HoldRpcPayload;
  if (payload.ok === true) return { ok: true };
  const taken = textList(payload.taken);
  logServerWarn("events.seats.conflict", {
    eventId: input.eventId,
    source: "claim",
    seatCount: taken.length,
  });
  return { ok: false, code: "seat_already_taken", taken };
}

export interface EventSeatHoldRows {
  heldByOthers: string[];
  myHolds: string[];
  expiresAt: string | null;
}

export async function loadEventSeatHoldRows(
  admin: SupabaseClient,
  eventId: string,
  tokenHash: string | null,
): Promise<EventSeatHoldRows> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("event_seat_holds")
    .select("seat_key, hold_token_hash, expires_at")
    .eq("event_id", eventId)
    .gt("expires_at", now);
  if (error) {
    logSupabaseClientError("events.seats.hold.load", error, { eventId });
    return { heldByOthers: [], myHolds: [], expiresAt: null };
  }
  const heldByOthers: string[] = [];
  const myHolds: string[] = [];
  let expiresAt: string | null = null;
  for (const row of data ?? []) {
    const key = String(row.seat_key);
    if (tokenHash && row.hold_token_hash === tokenHash) {
      myHolds.push(key);
      const exp = row.expires_at ? String(row.expires_at) : null;
      if (exp && (!expiresAt || exp < expiresAt)) expiresAt = exp;
    } else {
      heldByOthers.push(key);
    }
  }
  return { heldByOthers, myHolds, expiresAt };
}

export async function deleteExpiredEventSeatHolds(admin: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("event_seat_holds")
    .delete()
    .lt("expires_at", now)
    .select("id");
  if (error) {
    logSupabaseClientError("events.seats.hold.cleanup", error, {});
    return 0;
  }
  return data?.length ?? 0;
}
