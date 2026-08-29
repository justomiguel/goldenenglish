/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  addCalendarMonthsUtc,
  instituteZonedDateTimeUtc,
  isTrialSeatAdminReminderDue,
  isTrialSeatAutoAbsentDue,
  nextInstituteDateIso,
  normalizeTrialSeatStartHm,
} from "@/lib/register/trialSeatClassWindow";

describe("trialSeatClassWindow", () => {
  it("flags a booked seat whose start is inside the next hour", () => {
    const now = new Date("2026-08-31T14:30:00.000Z");
    expect(
      isTrialSeatAdminReminderDue({
        scheduledOn: "2026-08-31",
        startTime: "12:00",
        timeZone: "America/Argentina/Buenos_Aires",
        now,
        reminderAlreadySent: false,
      }),
    ).toBe(true);
  });

  it("does not remind twice or after the class started", () => {
    const now = new Date("2026-08-31T15:30:00.000Z");
    expect(
      isTrialSeatAdminReminderDue({
        scheduledOn: "2026-08-31",
        startTime: "12:00",
        timeZone: "America/Argentina/Buenos_Aires",
        now,
        reminderAlreadySent: false,
      }),
    ).toBe(false);
  });

  it("does not remind when already sent or the clock cannot be parsed", () => {
    const now = new Date("2026-08-31T14:30:00.000Z");
    expect(
      isTrialSeatAdminReminderDue({
        scheduledOn: "2026-08-31",
        startTime: "12:00",
        timeZone: "America/Argentina/Buenos_Aires",
        now,
        reminderAlreadySent: true,
      }),
    ).toBe(false);
    expect(
      isTrialSeatAdminReminderDue({
        scheduledOn: "not-a-date",
        startTime: "nope",
        timeZone: "America/Argentina/Buenos_Aires",
        now,
        reminderAlreadySent: false,
      }),
    ).toBe(false);
  });

  it("normalizes start times and advances calendar dates", () => {
    expect(normalizeTrialSeatStartHm("9:05:00")).toBe("09:05");
    expect(normalizeTrialSeatStartHm("bad")).toBe("00:00");
    expect(Number.isNaN(instituteZonedDateTimeUtc("xx", "12:00", "UTC").getTime())).toBe(true);
    expect(addCalendarMonthsUtc(new Date("2026-01-31T00:00:00.000Z"), 1).getUTCMonth()).toBe(2);
    expect(nextInstituteDateIso(new Date("2026-08-31T15:00:00.000Z"), "UTC")).toBe("2026-09-01");
  });

  it("auto-absents the next local day", () => {
    expect(
      isTrialSeatAutoAbsentDue({
        scheduledOn: "2026-08-31",
        timeZone: "America/Argentina/Buenos_Aires",
        now: new Date("2026-09-01T03:30:00.000Z"),
      }),
    ).toBe(true);
    expect(
      isTrialSeatAutoAbsentDue({
        scheduledOn: "2026-08-31",
        timeZone: "America/Argentina/Buenos_Aires",
        now: new Date("2026-08-31T20:00:00.000Z"),
      }),
    ).toBe(false);
  });
});
