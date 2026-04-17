import { describe, expect, it } from "vitest";
import { parseClassReminderSiteSettings } from "@/lib/notifications/parseClassReminderSiteSettings";

describe("parseClassReminderSiteSettings", () => {
  it("parses defaults and clamps offsets", () => {
    const rows = [
      { key: "class_reminders_enabled", value: true },
      { key: "class_reminder_prep_offset_minutes", value: 20000 },
      { key: "class_reminder_urgent_offset_minutes", value: 2000 },
      { key: "class_reminder_institute_tz", value: "America/Argentina/Cordoba" },
      { key: "class_reminder_whatsapp_quiet", value: { startHour: 22, startMinute: 0, endHour: 8, endMinute: 1 } },
    ];
    const s = parseClassReminderSiteSettings(rows as never);
    expect(s.remindersEnabled).toBe(true);
    expect(s.prepOffsetMinutes).toBe(10080);
    expect(s.urgentOffsetMinutes).toBe(1440);
    expect(s.instituteTimeZone).toBe("America/Argentina/Cordoba");
  });
});
