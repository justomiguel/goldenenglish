import { describe, expect, it } from "vitest";
import { getTeacherAttendanceMatrixScanLookbackBufferDays } from "@/lib/academics/academicsAttendanceMatrixProperties";
import {
  addUtcCalendarDaysIso,
  adminAttendanceMatrixColumnMaxIso,
  adminAttendanceMatrixEffMinIso,
  countClassDaysBetween,
  effectiveAttendanceDateMaxIso,
  effectiveAttendanceDateMinIso,
  hasEligibleClassDayInWindow,
  isoDateMatchesSectionScheduleSlots,
  isTeacherAttendanceDateAllowedForSection,
  listAttendanceClassDaysNewestCapped,
  listTeacherAttendanceClassDaysIso,
  pickEligibleAttendanceDateIso,
  teacherAttendanceMatrixScanMinIso,
} from "@/lib/academics/teacherSectionAttendanceCalendar";

describe("teacherSectionAttendanceCalendar", () => {
  it("effectiveAttendanceDateMinIso uses later of teacher min and section start", () => {
    expect(effectiveAttendanceDateMinIso("2026-04-10", "2026-04-12")).toBe("2026-04-12");
    expect(effectiveAttendanceDateMinIso("2026-04-10", "2026-04-08")).toBe("2026-04-10");
    expect(effectiveAttendanceDateMinIso("2026-04-10", null)).toBe("2026-04-10");
  });

  it("effectiveAttendanceDateMaxIso uses earlier of today and section end", () => {
    expect(effectiveAttendanceDateMaxIso("2026-04-20", "2026-04-15")).toBe("2026-04-15");
    expect(effectiveAttendanceDateMaxIso("2026-04-20", "2026-04-25")).toBe("2026-04-20");
  });

  it("adminAttendanceMatrixColumnMaxIso uses section end when set (even after today)", () => {
    expect(adminAttendanceMatrixColumnMaxIso("2026-04-13", "2026-11-30")).toBe("2026-11-30");
    expect(adminAttendanceMatrixColumnMaxIso("2026-04-13", null)).toBe("2026-04-13");
    expect(adminAttendanceMatrixColumnMaxIso("2026-04-13", "   ")).toBe("2026-04-13");
    expect(adminAttendanceMatrixColumnMaxIso("2026-04-13", "2026-11-30T00:00:00.000Z")).toBe("2026-11-30");
  });

  it("isoDateMatchesSectionScheduleSlots accepts any day when slots empty", () => {
    expect(isoDateMatchesSectionScheduleSlots("2026-04-13", [])).toBe(true);
  });

  it("isoDateMatchesSectionScheduleSlots matches weekday 0–6 at UTC noon", () => {
    // 2026-04-13 is Monday UTC noon anchor
    expect(isoDateMatchesSectionScheduleSlots("2026-04-13", [{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }])).toBe(
      true,
    );
    expect(isoDateMatchesSectionScheduleSlots("2026-04-13", [{ dayOfWeek: 2, startTime: "10:00", endTime: "11:00" }])).toBe(
      false,
    );
  });

  it("hasEligibleClassDayInWindow respects schedule", () => {
    const monOnly = [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }] as const;
    expect(hasEligibleClassDayInWindow("2026-04-13", "2026-04-15", [...monOnly])).toBe(true);
    expect(hasEligibleClassDayInWindow("2026-04-14", "2026-04-18", [...monOnly])).toBe(false);
  });

  it("teacher matrix scan min widens window so a weekly slot can appear in-range", () => {
    const monOnly = [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }] as const;
    const floor = "2026-04-14";
    const scanMin = teacherAttendanceMatrixScanMinIso(
      floor,
      "2026-01-01",
      getTeacherAttendanceMatrixScanLookbackBufferDays(),
    );
    expect(scanMin < floor).toBe(true);
    expect(hasEligibleClassDayInWindow("2026-04-14", "2026-04-18", [...monOnly])).toBe(false);
    expect(hasEligibleClassDayInWindow(scanMin, "2026-04-18", [...monOnly])).toBe(true);
  });

  it("hasEligibleClassDayInWindow is false when there are no slots", () => {
    expect(hasEligibleClassDayInWindow("2026-04-13", "2026-04-20", [])).toBe(false);
  });

  it("pickEligibleAttendanceDateIso snaps forward to next class day", () => {
    const monWed = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
    ];
    // 2026-04-14 is Tuesday → next is Wednesday 2026-04-15
    const out = pickEligibleAttendanceDateIso("2026-04-14", "2026-04-13", "2026-04-20", monWed);
    expect(out.dateIso).toBe("2026-04-15");
    expect(out.adjustedFromRequested).toBe(true);
  });

  it("isTeacherAttendanceDateAllowedForSection combines window, period, and slots", () => {
    const now = new Date(Date.UTC(2026, 3, 15, 15, 0, 0));
    const slots = [{ dayOfWeek: 3, startTime: "09:00", endTime: "10:00" }];
    expect(
      isTeacherAttendanceDateAllowedForSection("2026-04-15", now, {
        sectionStartsOn: "2026-04-01",
        sectionEndsOn: "2026-06-01",
        scheduleSlots: slots,
      }),
    ).toBe(true);
    expect(
      isTeacherAttendanceDateAllowedForSection("2026-04-14", now, {
        sectionStartsOn: "2026-04-01",
        sectionEndsOn: "2026-06-01",
        scheduleSlots: slots,
      }),
    ).toBe(false);
    expect(
      isTeacherAttendanceDateAllowedForSection("2026-04-15", now, {
        sectionStartsOn: "2026-04-01",
        sectionEndsOn: "2026-06-01",
        scheduleSlots: [],
      }),
    ).toBe(false);
    // Earlier Wednesday in the same term — allowed (no “last two days” cap at app layer).
    expect(
      isTeacherAttendanceDateAllowedForSection("2026-04-08", now, {
        sectionStartsOn: "2026-04-01",
        sectionEndsOn: "2026-06-01",
        scheduleSlots: slots,
      }),
    ).toBe(true);
    // Future class day within term — not editable yet.
    expect(
      isTeacherAttendanceDateAllowedForSection("2026-05-06", now, {
        sectionStartsOn: "2026-04-01",
        sectionEndsOn: "2026-06-01",
        scheduleSlots: [{ dayOfWeek: 3, startTime: "09:00", endTime: "10:00" }],
      }),
    ).toBe(false);
  });

  it("addUtcCalendarDaysIso steps calendar days in UTC", () => {
    expect(addUtcCalendarDaysIso("2026-04-13", 1)).toBe("2026-04-14");
    expect(addUtcCalendarDaysIso("2026-04-13", -1)).toBe("2026-04-12");
  });

  it("listTeacherAttendanceClassDaysIso lists matching weekdays and truncation", () => {
    const monWed = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
    ];
    const { days, truncated } = listTeacherAttendanceClassDaysIso("2026-04-13", "2026-04-30", monWed, 3);
    expect(days.length).toBe(3);
    expect(truncated).toBe(true);
  });

  it("listTeacherAttendanceClassDaysIso returns empty when there are no slots", () => {
    expect(listTeacherAttendanceClassDaysIso("2026-04-13", "2026-04-20", [], 10)).toEqual({
      days: [],
      truncated: false,
    });
  });

  it("countClassDaysBetween matches listTeacherAttendanceClassDaysIso length and is 0 without slots", () => {
    const monWed = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
    ];
    expect(countClassDaysBetween("2026-04-13", "2026-04-30", monWed)).toBe(
      listTeacherAttendanceClassDaysIso("2026-04-13", "2026-04-30", monWed, 999).days.length,
    );
    expect(countClassDaysBetween("2026-04-13", "2026-04-30", [])).toBe(0);
  });

  it("listAttendanceClassDaysNewestCapped returns the latest class days in ascending order", () => {
    const sun = [{ dayOfWeek: 0, startTime: "10:00", endTime: "11:00" }] as const;
    const r = listAttendanceClassDaysNewestCapped("2026-04-01", "2026-04-30", sun as never, 3);
    expect(r.days).toEqual(["2026-04-12", "2026-04-19", "2026-04-26"]);
    expect(r.truncated).toBe(true);
  });

  it("adminAttendanceMatrixEffMinIso uses section start when valid", () => {
    expect(adminAttendanceMatrixEffMinIso("2026-04-13", "2025-09-01")).toBe("2025-09-01");
  });

  it("adminAttendanceMatrixEffMinIso falls back when section start missing", () => {
    expect(adminAttendanceMatrixEffMinIso("2026-04-13", null)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
