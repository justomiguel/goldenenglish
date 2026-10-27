import {
  generateFloorSeats,
  type EventSeatFloor,
  type EventSeatMapConfig,
  type GeneratedFloorSeat,
} from "@/lib/events/seatMapModel";

export type EventSeatVisualState = "free" | "reserved" | "pending" | "purchased";

export interface EventSeatLockSnapshot {
  seatKey: string;
  attendeeStatus: "pending_payment" | "confirmed";
}

export interface ResolvedFloorSeat extends GeneratedFloorSeat {
  state: EventSeatVisualState;
}

export function resolveFloorSeatsWithState(
  floor: EventSeatFloor,
  locks: readonly EventSeatLockSnapshot[],
): ResolvedFloorSeat[] {
  const lockBySeatKey = new Map<string, "pending_payment" | "confirmed">();
  for (const lock of locks) {
    lockBySeatKey.set(lock.seatKey, lock.attendeeStatus);
  }

  return generateFloorSeats(floor).map((seat) => {
    const lockStatus = lockBySeatKey.get(seat.seatKey);
    let state: EventSeatVisualState = "free";
    if (lockStatus === "confirmed") {
      state = "purchased";
    } else if (lockStatus === "pending_payment") {
      state = "pending";
    } else if (seat.staffReserved) {
      state = "reserved";
    }
    return { ...seat, state };
  });
}

export function isEventSeatMapActive(
  config: EventSeatMapConfig | null | undefined,
): boolean {
  if (!config?.enabled) return false;
  return config.floors.some((floor) => generateFloorSeats(floor).length > 0);
}

export type ValidateEventSeatSelectionResult =
  | {
      ok: true;
      assignedSeats: Array<{ seatKey: string; seatLabel: string }>;
    }
  | {
      ok: false;
      code: "seat_count_mismatch" | "invalid_seat" | "seat_already_taken";
    };

export function validateEventSeatSelection(input: {
  config: EventSeatMapConfig | null | undefined;
  locks: readonly EventSeatLockSnapshot[];
  selectedSeatKeys: readonly string[];
  requiredSeatCount: number;
}): ValidateEventSeatSelectionResult {
  if (!isEventSeatMapActive(input.config) || !input.config) {
    return { ok: true, assignedSeats: [] };
  }

  const normalizedKeys = input.selectedSeatKeys
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
  const uniqueKeys = [...new Set(normalizedKeys)];

  if (uniqueKeys.length !== input.requiredSeatCount) {
    return { ok: false, code: "seat_count_mismatch" };
  }

  const seatByKey = new Map<string, ResolvedFloorSeat>();
  for (const floor of input.config.floors) {
    for (const seat of resolveFloorSeatsWithState(floor, input.locks)) {
      seatByKey.set(seat.seatKey, seat);
    }
  }

  const assignedSeats: Array<{ seatKey: string; seatLabel: string }> = [];
  for (const seatKey of uniqueKeys) {
    const resolved = seatByKey.get(seatKey);
    if (!resolved) {
      return { ok: false, code: "invalid_seat" };
    }
    if (resolved.state !== "free") {
      return { ok: false, code: "seat_already_taken" };
    }
    assignedSeats.push({
      seatKey: resolved.seatKey,
      seatLabel: resolved.seatLabel,
    });
  }

  return { ok: true, assignedSeats };
}
