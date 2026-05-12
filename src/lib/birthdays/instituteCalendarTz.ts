import { DateTime } from "luxon";

/** Institute wall clock for academic / portal civil dates (matches repo conventions). */
export const INSTITUTE_CALENDAR_TIMEZONE = "America/Argentina/Cordoba";

/** Civil `YYYY-MM-DD` in the institute time zone (for portal calendar chips / RPC alignment). */
export function instituteCivilIsoDateFromInstant(instant: Date): string {
  return instant.toLocaleDateString("en-CA", { timeZone: INSTITUTE_CALENDAR_TIMEZONE });
}

/** Millisecond range for the institute civil day that contains `instant`. */
export function instituteZonedDayBoundsMs(instant: Date): { dayStartMs: number; dayEndMs: number } {
  const zoned = DateTime.fromJSDate(instant, { zone: INSTITUTE_CALENDAR_TIMEZONE });
  const start = zoned.startOf("day");
  const end = zoned.endOf("day");
  return { dayStartMs: start.toMillis(), dayEndMs: end.toMillis() };
}
