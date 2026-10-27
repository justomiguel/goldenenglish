import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventSeatLockSnapshot } from "@/lib/events/seatMapState";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

interface SeatLockJoinRow {
  seat_key: string;
  event_attendees:
    | { status: string }
    | Array<{ status: string }>
    | null;
}

function extractAttendeeStatus(
  raw: SeatLockJoinRow["event_attendees"],
): string | null {
  if (!raw) return null;
  const item = Array.isArray(raw) ? raw[0] : raw;
  return item?.status ? String(item.status) : null;
}

export async function loadEventSeatLocks(
  admin: SupabaseClient,
  eventId: string,
): Promise<EventSeatLockSnapshot[]> {
  const { data, error } = await admin
    .from("event_seat_locks")
    .select("seat_key, event_attendees!inner(status)")
    .eq("event_id", eventId);

  if (error) {
    logSupabaseClientError("loadEventSeatLocks:select", error, { eventId });
    return [];
  }

  const rows = (data ?? []) as SeatLockJoinRow[];
  const locks: EventSeatLockSnapshot[] = [];
  for (const row of rows) {
    const status = extractAttendeeStatus(row.event_attendees);
    if (status === "pending_payment" || status === "confirmed") {
      locks.push({
        seatKey: String(row.seat_key),
        attendeeStatus: status,
      });
    }
  }
  return locks;
}

export async function lockSeatsForAttendee(
  admin: SupabaseClient,
  input: {
    eventId: string;
    attendeeId: string;
    seats: ReadonlyArray<{ seatKey: string; seatLabel: string }>;
  },
): Promise<{ ok: true } | { ok: false; code: "seat_already_taken" | "lock_failed" }> {
  if (input.seats.length === 0) return { ok: true };

  const rows = input.seats.map((seat) => ({
    event_id: input.eventId,
    attendee_id: input.attendeeId,
    seat_key: seat.seatKey,
    seat_label: seat.seatLabel,
  }));

  const { error: insertError } = await admin.from("event_seat_locks").insert(rows);
  if (insertError) {
    logSupabaseClientError("lockSeatsForAttendee:insert", insertError, {
      eventId: input.eventId,
      attendeeId: input.attendeeId,
    });
    const { error: rollbackError } = await admin
      .from("event_attendees")
      .delete()
      .eq("id", input.attendeeId);
    if (rollbackError) {
      logSupabaseClientError("lockSeatsForAttendee:rollback", rollbackError, {
        attendeeId: input.attendeeId,
      });
    }
    const isConflict = String(insertError.code ?? "") === "23505";
    return { ok: false, code: isConflict ? "seat_already_taken" : "lock_failed" };
  }

  const seatLabels = input.seats.map((seat) => seat.seatLabel);
  const { error: updateError } = await admin
    .from("event_attendees")
    .update({ seat_labels: seatLabels })
    .eq("id", input.attendeeId);

  if (updateError) {
    logSupabaseClientError("lockSeatsForAttendee:updateLabels", updateError, {
      attendeeId: input.attendeeId,
    });
  }

  return { ok: true };
}

export async function releaseSeatsForAttendee(
  admin: SupabaseClient,
  attendeeId: string,
): Promise<void> {
  if (!attendeeId) return;
  const tableApi = admin.from("event_seat_locks") as { delete?: unknown };
  if (typeof tableApi?.delete !== "function") return;
  const { error } = await admin
    .from("event_seat_locks")
    .delete()
    .eq("attendee_id", attendeeId);
  if (error) {
    logSupabaseClientError("releaseSeatsForAttendee:delete", error, { attendeeId });
  }
}
