import { wallClockPartsInTimeZone } from "@/lib/notifications/classReminderQuietHours";

export function isoDateInTimeZoneFromUtcMs(ms: number, timeZone: string): string {
  const p = wallClockPartsInTimeZone(new Date(ms).toISOString(), timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
