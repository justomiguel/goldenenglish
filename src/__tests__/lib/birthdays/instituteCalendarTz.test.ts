import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import {
  INSTITUTE_CALENDAR_TIMEZONE,
  instituteCivilIsoDateFromInstant,
  instituteZonedDayBoundsMs,
} from "@/lib/birthdays/instituteCalendarTz";

describe("instituteCalendarTz", () => {
  it("returns civil YYYY-MM-DD in institute zone", () => {
    const js = DateTime.fromObject(
      { year: 2026, month: 6, day: 13, hour: 9 },
      { zone: INSTITUTE_CALENDAR_TIMEZONE },
    ).toJSDate();
    expect(instituteCivilIsoDateFromInstant(js)).toBe("2026-06-13");
  });

  it("bounds the institute civil day for an instant", () => {
    const js = DateTime.fromObject(
      { year: 2026, month: 6, day: 13, hour: 15 },
      { zone: INSTITUTE_CALENDAR_TIMEZONE },
    ).toJSDate();
    const { dayStartMs, dayEndMs } = instituteZonedDayBoundsMs(js);
    const start = DateTime.fromMillis(dayStartMs, { zone: INSTITUTE_CALENDAR_TIMEZONE });
    const end = DateTime.fromMillis(dayEndMs, { zone: INSTITUTE_CALENDAR_TIMEZONE });
    expect(start.toISODate()).toBe("2026-06-13");
    expect(end.toISODate()).toBe("2026-06-13");
    expect(dayEndMs).toBeGreaterThan(dayStartMs);
  });
});
