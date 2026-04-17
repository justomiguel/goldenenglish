import { parseSectionScheduleSlots, timeToMinutes } from "@/lib/academics/sectionScheduleSlots";
import type { TeacherDashboardTodayClass } from "@/types/teacherDashboard";

type SectionInput = {
  id: string;
  name: string;
  cohortName: string;
  schedule_slots: unknown;
};

/**
 * Sections with at least one slot on the UTC calendar weekday of `now`,
 * aligned with teacher attendance date helpers (`utcCalendarDateIso`).
 */
export function listTeacherTodayClassesUtc(
  sections: SectionInput[],
  now: Date,
): TeacherDashboardTodayClass[] {
  const dow = now.getUTCDay();
  const out: (TeacherDashboardTodayClass & { _sort: number })[] = [];
  for (const sec of sections) {
    const slots = parseSectionScheduleSlots(sec.schedule_slots);
    const label = sec.cohortName ? `${sec.cohortName} — ${sec.name}` : sec.name;
    for (const slot of slots) {
      if (slot.dayOfWeek !== dow) continue;
      const sm = timeToMinutes(slot.startTime);
      if (sm < 0) continue;
      out.push({
        sectionId: sec.id,
        label,
        startTime: slot.startTime,
        endTime: slot.endTime,
        _sort: sm,
      });
    }
  }
  out.sort((a, b) => a._sort - b._sort);
  return out.map((row) => {
    const { _sort, ...rest } = row;
    void _sort;
    return rest;
  });
}
