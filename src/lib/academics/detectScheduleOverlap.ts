import type { SectionScheduleSlot } from "@/types/academics";
import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";

function slotOverlaps(a: SectionScheduleSlot, b: SectionScheduleSlot): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  const sa = timeToMinutes(a.startTime);
  const ea = timeToMinutes(a.endTime);
  const sb = timeToMinutes(b.startTime);
  const eb = timeToMinutes(b.endTime);
  if (sa < 0 || ea < 0 || sb < 0 || eb < 0) return false;
  if (sa >= ea || sb >= eb) return false;
  return sa < eb && sb < ea;
}

/** True if any slot in `a` overlaps any slot in `b` (same calendar weekday index 0–6). */
export function schedulesOverlap(
  a: SectionScheduleSlot[],
  b: SectionScheduleSlot[],
): boolean {
  for (const x of a) {
    for (const y of b) {
      if (slotOverlaps(x, y)) return true;
    }
  }
  return false;
}
