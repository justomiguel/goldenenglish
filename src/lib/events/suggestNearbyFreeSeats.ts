import { generateFloorSeats, type EventSeatMapConfig } from "@/lib/events/seatMapModel";
import {
  resolveFloorSeatsWithState,
  type EventSeatLockSnapshot,
} from "@/lib/events/seatMapState";

export function suggestNearbyFreeSeats(input: {
  config: EventSeatMapConfig;
  locks: readonly EventSeatLockSnapshot[];
  heldByOthers: readonly string[];
  lostSeatKeys: readonly string[];
  neededCount: number;
}): string[] {
  if (input.neededCount <= 0 || input.lostSeatKeys.length === 0) return [];

  const seats = input.config.floors.flatMap((floor) =>
    resolveFloorSeatsWithState(floor, input.locks, input.heldByOthers),
  );
  const byKey = new Map(seats.map((seat) => [seat.seatKey, seat]));
  const anchors = input.lostSeatKeys
    .map((key) => byKey.get(key))
    .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat));
  if (anchors.length === 0) return [];

  const anchor = anchors[0];
  const blocked = new Set([...input.lostSeatKeys, ...input.heldByOthers]);
  const candidates = seats
    .filter(
      (seat) =>
        seat.state === "free" &&
        !blocked.has(seat.seatKey) &&
        seat.floorId === anchor.floorId &&
        seat.blockId === anchor.blockId,
    )
    .toSorted((a, b) => {
      const rowA = Math.abs(a.rowIndex - anchor.rowIndex);
      const rowB = Math.abs(b.rowIndex - anchor.rowIndex);
      if (rowA !== rowB) return rowA - rowB;
      return Math.abs(a.colIndex - anchor.colIndex) - Math.abs(b.colIndex - anchor.colIndex);
    });

  return candidates.slice(0, input.neededCount).map((seat) => seat.seatKey);
}

export function seatLabelsForKeys(config: EventSeatMapConfig, keys: readonly string[]): string[] {
  const labels = new Map<string, string>();
  for (const floor of config.floors) {
    for (const seat of generateFloorSeats(floor)) {
      labels.set(seat.seatKey, seat.seatLabel);
    }
  }
  return keys.map((key) => labels.get(key) ?? key);
}
