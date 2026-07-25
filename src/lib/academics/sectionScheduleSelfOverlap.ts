import type { SectionScheduleSlot } from "@/types/academics";
import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";

function slotsOverlap(a: SectionScheduleSlot, b: SectionScheduleSlot): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  const sa = timeToMinutes(a.startTime);
  const ea = timeToMinutes(a.endTime);
  const sb = timeToMinutes(b.startTime);
  const eb = timeToMinutes(b.endTime);
  if (sa < 0 || ea < 0 || sb < 0 || eb < 0) return false;
  if (sa >= ea || sb >= eb) return false;
  return sa < eb && sb < ea;
}

/** True if candidate overlaps any slot in the list (optionally ignoring one index). */
export function sectionScheduleSlotSelfOverlaps(
  slots: SectionScheduleSlot[],
  candidate: SectionScheduleSlot,
  ignoreIndex?: number,
): boolean {
  for (let i = 0; i < slots.length; i++) {
    if (ignoreIndex !== undefined && i === ignoreIndex) continue;
    if (slotsOverlap(slots[i], candidate)) return true;
  }
  return false;
}
