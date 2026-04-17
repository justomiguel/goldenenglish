import { describe, expect, it } from "vitest";
import {
  buildClassReminderJobUpsertRows,
  type SyncReminderEnrollmentRow,
} from "@/lib/notifications/buildClassReminderJobUpsertRows";
import type { ClassReminderSiteSettings } from "@/types/classReminders";

const baseSettings: ClassReminderSiteSettings = {
  remindersEnabled: true,
  prepOffsetMinutes: 60 * 12, // 12h before class
  urgentOffsetMinutes: 60, // 1h before class
  instituteTimeZone: "America/Argentina/Cordoba",
  whatsappQuiet: { startHour: 22, startMinute: 0, endHour: 8, endMinute: 0 },
};

function baseEnrollment(
  overrides: Partial<SyncReminderEnrollmentRow> = {},
): SyncReminderEnrollmentRow {
  return {
    enrollmentId: "enr-1",
    sectionId: "sec-1",
    studentId: "stu-1",
    isMinor: false,
    cohortName: "Cohort A",
    sectionName: "Section 1",
    cohortId: "coh-1",
    teacherId: "tch-1",
    startsOn: "2026-05-04",
    endsOn: "2026-05-31",
    scheduleSlots: [{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }],
    roomLabel: "Aula 3",
    tutorIdsOrdered: [],
    ...overrides,
  };
}

// 2026-05-04 is a Monday in any TZ; we anchor "now" well before so all occurrences are future.
const NOW_MS = Date.parse("2026-05-04T00:00:00.000Z");

describe("buildClassReminderJobUpsertRows", () => {
  it("returns three jobs (prep_email, urgent_in_app, urgent_whatsapp) for a single future occurrence", () => {
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({ startsOn: "2026-05-04", endsOn: "2026-05-04" }),
      baseSettings,
      NOW_MS,
    );
    expect(rows.length).toBe(3);
    const kinds = rows.map((r) => r.kind).sort();
    expect(kinds).toEqual(["prep_email", "urgent_in_app", "urgent_whatsapp"]);
    for (const r of rows) {
      expect(r.idempotency_key).toMatch(/^enr:enr-1:/);
      expect(r.section_enrollment_id).toBe("enr-1");
      expect(r.recipient_user_id).toBe("stu-1");
      expect(r.status).toBe("pending");
      expect(typeof r.send_at).toBe("string");
    }
    const prep = rows.find((r) => r.kind === "prep_email");
    expect(prep?.payload).toMatchObject({
      sectionLabel: "Cohort A — Section 1",
      roomLabel: "Aula 3",
      channel: "email",
    });
    const urgentInApp = rows.find((r) => r.kind === "urgent_in_app");
    expect(urgentInApp?.payload).toMatchObject({ channel: "in_app" });
    const urgentWa = rows.find((r) => r.kind === "urgent_whatsapp");
    expect(urgentWa?.payload).toMatchObject({ channel: "whatsapp" });
  });

  it("returns empty array when minor has no tutors (recipient cannot be resolved)", () => {
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({ isMinor: true, tutorIdsOrdered: [] }),
      baseSettings,
      NOW_MS,
    );
    expect(rows).toEqual([]);
  });

  it("uses first tutor as recipient when student is minor", () => {
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({
        isMinor: true,
        tutorIdsOrdered: ["tutor-A", "tutor-B"],
        startsOn: "2026-05-04",
        endsOn: "2026-05-04",
      }),
      baseSettings,
      NOW_MS,
    );
    expect(rows.length).toBe(3);
    for (const r of rows) {
      expect(r.recipient_user_id).toBe("tutor-A");
    }
  });

  it("returns empty array when section ends before view start (viewStart > viewEnd)", () => {
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({ startsOn: "2024-01-01", endsOn: "2024-01-31" }),
      baseSettings,
      NOW_MS,
    );
    expect(rows).toEqual([]);
  });

  it("skips occurrences whose start is in the past", () => {
    // anchor now to mid-day on the same Monday so the 10:00 class is in the past
    const now = Date.parse("2026-05-04T22:00:00.000Z");
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({ startsOn: "2026-05-04", endsOn: "2026-05-10" }),
      baseSettings,
      now,
    );
    // First class on 5/4 is past; the next slot is on 5/11 which is outside endsOn (5/10) → 0
    expect(rows).toEqual([]);
  });

  it("skips prep_email when prepSendMs is already in the past but keeps urgent jobs", () => {
    // Class at ~13:00 UTC (10:00 local in Cordoba is UTC-3 → 13:00Z); prep is 12h before (01:00Z).
    // Anchor now to 06:00Z so prep is past but urgent (12:00Z) is still future.
    const now = Date.parse("2026-05-04T06:00:00.000Z");
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({ startsOn: "2026-05-04", endsOn: "2026-05-04" }),
      baseSettings,
      now,
    );
    const kinds = rows.map((r) => r.kind).sort();
    expect(kinds).toContain("urgent_in_app");
    expect(kinds).toContain("urgent_whatsapp");
    expect(kinds).not.toContain("prep_email");
  });

  it("caps the number of occurrences considered (MAX_OCCURRENCES_PER_ENROLLMENT)", () => {
    // Use a wide window with daily slots over many weeks; it must not produce more than 40 occurrences * 3 jobs.
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({
        startsOn: "2026-05-04",
        endsOn: "2027-12-31",
        scheduleSlots: [
          { dayOfWeek: 0, startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: 4, startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: 6, startTime: "09:00", endTime: "10:00" },
        ],
      }),
      baseSettings,
      NOW_MS,
    );
    // 40 occurrences * 3 jobs each = 120 max
    expect(rows.length).toBeLessThanOrEqual(40 * 3);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("shifts urgent_whatsapp send_at out of WhatsApp quiet hours when it would land at night", () => {
    // Class at 09:00 local → urgent (1h before) at 08:00 local, just outside quiet (ends 08:00).
    // To land in quiet, set class at 08:30 local → urgent at 07:30 local (in quiet 22:00–08:00).
    const enrollment = baseEnrollment({
      startsOn: "2026-05-04",
      endsOn: "2026-05-04",
      scheduleSlots: [{ dayOfWeek: 1, startTime: "08:30", endTime: "09:30" }],
    });
    const rows = buildClassReminderJobUpsertRows(enrollment, baseSettings, NOW_MS);
    const wa = rows.find((r) => r.kind === "urgent_whatsapp");
    const inApp = rows.find((r) => r.kind === "urgent_in_app");
    expect(wa).toBeDefined();
    expect(inApp).toBeDefined();
    // The WhatsApp job should be scheduled at or after the in-app urgent (it can shift forward).
    expect(Date.parse(wa!.send_at)).toBeGreaterThanOrEqual(Date.parse(inApp!.send_at));
  });

  it("returns empty array when no schedule slots produce any class occurrence", () => {
    const rows = buildClassReminderJobUpsertRows(
      baseEnrollment({ scheduleSlots: [] }),
      baseSettings,
      NOW_MS,
    );
    expect(rows).toEqual([]);
  });
});
