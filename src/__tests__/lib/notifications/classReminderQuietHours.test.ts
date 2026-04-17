import { describe, expect, it } from "vitest";
import { shiftUtcInstantOutOfWhatsappQuiet, wallClockPartsInTimeZone } from "@/lib/notifications/classReminderQuietHours";

describe("classReminderQuietHours", () => {
  it("does not shift when outside quiet window in Cordoba", () => {
    const tz = "America/Argentina/Cordoba";
    const quiet = { startHour: 22, startMinute: 0, endHour: 8, endMinute: 1 };
    const iso = "2026-06-15T12:00:00.000Z";
    expect(shiftUtcInstantOutOfWhatsappQuiet(iso, tz, quiet)).toBe(iso);
  });

  it("advances an instant that falls inside quiet hours", () => {
    const tz = "America/Argentina/Cordoba";
    const quiet = { startHour: 22, startMinute: 0, endHour: 8, endMinute: 1 };
    const raw = "2026-06-15T06:00:00.000Z";
    const shifted = shiftUtcInstantOutOfWhatsappQuiet(raw, tz, quiet);
    expect(new Date(shifted).getTime()).toBeGreaterThanOrEqual(new Date(raw).getTime());
    const after = wallClockPartsInTimeZone(shifted, tz);
    expect(after.hour * 60 + after.minute).toBeGreaterThanOrEqual(8 * 60 + 1);
  });
});
