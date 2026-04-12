import { describe, it, expect } from "vitest";
import {
  consecutivePresentStreak,
  mandatoryAttendanceStats,
  mandatoryAttendanceStatsForMonth,
} from "@/lib/attendance/stats";

describe("attendance stats", () => {
  it("counts justified mandatory rows", () => {
    const rows = [
      {
        attendance_date: "2026-02-01",
        status: "justified" as const,
        is_mandatory: true,
      },
    ];
    const s = mandatoryAttendanceStats(rows);
    expect(s.justified).toBe(1);
    expect(s.present).toBe(0);
    expect(s.absent).toBe(0);
    expect(s.total).toBe(1);
  });

  it("counts mandatory present vs absent", () => {
    const rows = [
      {
        attendance_date: "2026-02-01",
        status: "present" as const,
        is_mandatory: true,
      },
      {
        attendance_date: "2026-02-08",
        status: "absent" as const,
        is_mandatory: true,
      },
      {
        attendance_date: "2026-02-15",
        status: "present" as const,
        is_mandatory: false,
      },
    ];
    const s = mandatoryAttendanceStats(rows);
    expect(s.present).toBe(1);
    expect(s.absent).toBe(1);
    expect(s.total).toBe(2);
  });

  it("mandatoryAttendanceStatsForMonth skips short dates and wrong months", () => {
    const rows = [
      {
        attendance_date: "bad",
        status: "present" as const,
        is_mandatory: true,
      },
      {
        attendance_date: "2026-03-10",
        status: "present" as const,
        is_mandatory: false,
      },
      {
        attendance_date: "2025-03-10",
        status: "present" as const,
        is_mandatory: true,
      },
    ];
    expect(mandatoryAttendanceStatsForMonth(rows, 2026, 3)).toEqual({ present: 0, total: 0 });
  });

  it("mandatoryAttendanceStatsForMonth filters by year and month", () => {
    const rows = [
      {
        attendance_date: "2026-03-10",
        status: "present" as const,
        is_mandatory: true,
      },
      {
        attendance_date: "2026-04-05",
        status: "present" as const,
        is_mandatory: true,
      },
    ];
    const m = mandatoryAttendanceStatsForMonth(rows, 2026, 3);
    expect(m.present).toBe(1);
    expect(m.total).toBe(1);
  });

  it("returns zero streak when newest mandatory is not present", () => {
    const rows = [
      {
        attendance_date: "2026-03-01",
        status: "absent" as const,
        is_mandatory: true,
      },
      {
        attendance_date: "2026-02-01",
        status: "present" as const,
        is_mandatory: true,
      },
    ];
    expect(consecutivePresentStreak(rows)).toBe(0);
  });

  it("streak stops at first non-present from most recent mandatory", () => {
    const rows = [
      {
        attendance_date: "2026-03-01",
        status: "present" as const,
        is_mandatory: true,
      },
      {
        attendance_date: "2026-02-01",
        status: "absent" as const,
        is_mandatory: true,
      },
    ];
    expect(consecutivePresentStreak(rows)).toBe(1);
  });
});
