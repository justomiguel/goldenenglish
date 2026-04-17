import { describe, expect, it } from "vitest";
import { chunkIds } from "@/lib/notifications/chunkIds";
import {
  DEFAULT_CLASS_REMINDER_CHANNEL_PREFS,
  mergeClassReminderChannelPrefs,
} from "@/lib/notifications/mergeClassReminderChannelPrefs";
import { isoDateInTimeZoneFromUtcMs } from "@/lib/notifications/todayIsoInTimeZone";

describe("chunkIds", () => {
  it("splits an array into evenly-sized chunks", () => {
    expect(chunkIds([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunkIds([], 5)).toEqual([]);
  });

  it("keeps the whole input when size exceeds length", () => {
    expect(chunkIds(["a", "b"], 10)).toEqual([["a", "b"]]);
  });
});

describe("mergeClassReminderChannelPrefs", () => {
  it("returns defaults when row is null", () => {
    expect(mergeClassReminderChannelPrefs(null)).toEqual(
      DEFAULT_CLASS_REMINDER_CHANNEL_PREFS,
    );
  });

  it("returns defaults when row is undefined", () => {
    expect(mergeClassReminderChannelPrefs(undefined)).toEqual(
      DEFAULT_CLASS_REMINDER_CHANNEL_PREFS,
    );
  });

  it("respects explicit false flags", () => {
    const merged = mergeClassReminderChannelPrefs({
      email_class_prep: false,
      in_app_class_urgent: false,
      whatsapp_class_urgent: true,
      whatsapp_opt_in_at: "2026-01-01T00:00:00Z",
      whatsapp_phone_e164: "+5491111111111",
    });
    expect(merged).toEqual({
      email_class_prep: false,
      in_app_class_urgent: false,
      whatsapp_class_urgent: true,
      whatsapp_opt_in_at: "2026-01-01T00:00:00Z",
      whatsapp_phone_e164: "+5491111111111",
    });
  });

  it("falls back to defaults when individual fields are missing", () => {
    const merged = mergeClassReminderChannelPrefs({});
    expect(merged).toEqual(DEFAULT_CLASS_REMINDER_CHANNEL_PREFS);
  });
});

describe("isoDateInTimeZoneFromUtcMs", () => {
  it("returns the calendar date in the requested timezone (UTC)", () => {
    const ms = Date.UTC(2026, 3, 17, 12, 0, 0);
    expect(isoDateInTimeZoneFromUtcMs(ms, "UTC")).toBe("2026-04-17");
  });

  it("rolls back to the previous day when the timezone is behind UTC", () => {
    const ms = Date.UTC(2026, 3, 17, 2, 0, 0);
    expect(isoDateInTimeZoneFromUtcMs(ms, "America/Argentina/Cordoba")).toBe(
      "2026-04-16",
    );
  });
});
