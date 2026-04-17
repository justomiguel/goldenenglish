/** Human-readable summary of `academic_sections.schedule_slots` JSON. */

import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";

/**
 * Uses the same parsing as attendance / conflicts (`parseSectionScheduleSlots`) so weekday labels
 * match the matrix (e.g. string `dayOfWeek` from JSON is coerced; invalid rows are omitted).
 */
export function formatAcademicScheduleSummary(raw: unknown, locale: string): string {
  const slots = parseSectionScheduleSlots(raw);
  if (slots.length === 0) return "";

  /** `timeZone: "UTC"` so weekday matches slot `dayOfWeek` (0=Sun..6=Sat), not the server’s local zone. */
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const base = new Date(Date.UTC(2024, 0, 7, 12, 0, 0)); // Sunday noon UTC anchor

  const parts = slots.map((s) => {
    const d = s.dayOfWeek;
    const day =
      d >= 0 && d <= 6
        ? fmt.format(new Date(base.getTime() + d * 86400000))
        : "—";
    const st = typeof s.startTime === "string" ? s.startTime.trim() : "";
    const en = typeof s.endTime === "string" ? s.endTime.trim() : "";
    if (st && en) return `${day} ${st}–${en}`;
    if (st) return `${day} ${st}`;
    return day;
  });

  return parts.join(" · ");
}
