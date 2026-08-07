import type { SectionScheduleSlot } from "@/types/academics";
import { slotKey } from "@/lib/academics/sectionWeekScheduleDraftCompare";

/**
 * Per draft index: `true` when that exact slot is not accounted for in the
 * persisted `initialSlots` multiset (same identity as dirty compare keys).
 */
export function buildSectionScheduleSlotUnsavedFlags(
  draftSlots: readonly SectionScheduleSlot[],
  initialSlots: readonly SectionScheduleSlot[],
): boolean[] {
  const remaining = new Map<string, number>();
  for (const slot of initialSlots) {
    const key = slotKey(slot);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }

  return draftSlots.map((slot) => {
    const key = slotKey(slot);
    const count = remaining.get(key) ?? 0;
    if (count <= 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
}
