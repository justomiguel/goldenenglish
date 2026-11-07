import type { EventSeatVisualState } from "@/lib/events/seatMapState";

export type SeatToggleDecision =
  | { action: "remove" | "add" | "replace"; next: string[] }
  | { action: "refuse"; seatKey: string };

export function decideSeatToggle(input: {
  seatKey: string;
  state: EventSeatVisualState;
  selectedSeatKeys: readonly string[];
  requiredCount: number;
}): SeatToggleDecision {
  if (input.selectedSeatKeys.includes(input.seatKey)) {
    return {
      action: "remove",
      next: input.selectedSeatKeys.filter((key) => key !== input.seatKey),
    };
  }
  if (input.state !== "free") return { action: "refuse", seatKey: input.seatKey };
  if (input.selectedSeatKeys.length >= input.requiredCount) {
    return { action: "replace", next: [...input.selectedSeatKeys.slice(1), input.seatKey] };
  }
  return { action: "add", next: [...input.selectedSeatKeys, input.seatKey] };
}
