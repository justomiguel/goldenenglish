export type SectionScheduleWeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export function sectionScheduleWeekdayKey(dayOfWeek: number): SectionScheduleWeekdayKey {
  if (dayOfWeek === 0) return "sun";
  if (dayOfWeek === 1) return "mon";
  if (dayOfWeek === 2) return "tue";
  if (dayOfWeek === 3) return "wed";
  if (dayOfWeek === 4) return "thu";
  if (dayOfWeek === 5) return "fri";
  return "sat";
}

