import type { EventRegisterSeatPickerLabels } from "@/components/organisms/EventRegisterSeatPicker";
import type { EventSeatVisualState } from "@/lib/events/seatMapState";

export function seatStateLabel(state: EventSeatVisualState, labels: EventRegisterSeatPickerLabels): string {
  if (state === "free") return labels.legendFree;
  if (state === "reserved") return labels.legendReserved;
  if (state === "pending") return labels.legendPending;
  if (state === "held") return labels.legendHeld;
  return labels.legendPurchased;
}

export function seatToneClasses(state: EventSeatVisualState, isSelected: boolean): string {
  if (isSelected) return "text-[var(--color-secondary)] ring-2 ring-[var(--color-foreground)] rounded-md scale-105";
  if (state === "purchased") return "cursor-not-allowed text-[var(--color-muted-foreground)]/45";
  if (state === "pending") return "cursor-not-allowed text-[var(--color-warning)]";
  if (state === "held") return "cursor-not-allowed text-[var(--color-muted-foreground)]";
  if (state === "reserved") return "cursor-not-allowed text-[var(--color-secondary)]/55";
  return "text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:scale-105";
}
