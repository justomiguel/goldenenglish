import type { SectionScheduleSlot } from "@/types/academics";
import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";

export type SectionWeekScheduleDraftState = Readonly<{
  slots: SectionScheduleSlot[];
  selectedIndex: number | null;
  error: string | null;
}>;

export function normalizeForCompare(slots: SectionScheduleSlot[]): SectionScheduleSlot[] {
  const trimmed = slots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime.trim().slice(0, 5),
    endTime: s.endTime.trim().slice(0, 5),
  }));
  return trimmed.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

export function slotKey(slot: SectionScheduleSlot): string {
  return `${slot.dayOfWeek}:${slot.startTime.trim().slice(0, 5)}:${slot.endTime.trim().slice(0, 5)}`;
}

export function resolvePreviousSelectionKey(
  state: SectionWeekScheduleDraftState,
): string | null {
  if (state.selectedIndex === null) return null;
  const selected = state.slots[state.selectedIndex];
  if (!selected) return null;
  return slotKey(selected);
}

export function resolveNextSelectedIndex(args: {
  nextSlots: SectionScheduleSlot[];
  previousSelectionKey: string | null;
}): number | null {
  if (!args.previousSelectionKey) return null;
  const idx = args.nextSlots.findIndex((s) => slotKey(s) === args.previousSelectionKey);
  return idx >= 0 ? idx : null;
}
