import { describe, it, expect } from "vitest";
import {
  consecutivePresentStreak,
  attendanceStats,
  attendanceStatsForMonth,
  mandatoryAttendanceStats,
  mandatoryAttendanceStatsForMonth,
} from "@/lib/attendance/stats";

describe("attendance stats", () => {
  it("counts excused rows", () => {
    const rows = [
      { attendance_date: "2026-02-01", status: "excused" as const },
    ];
    const s = attendanceStats(rows);
    expect(s.excused).toBe(1);
    expect(s.present).toBe(0);
    expect(s.absent).toBe(0);
    expect(s.total).toBe(1);
  });

  it("counts present, absent, late", () => {
    const rows = [
      { attendance_date: "2026-02-01", status: "present" as const },
      { attendance_date: "2026-02-08", status: "absent" as const },
      { attendance_date: "2026-02-15", status: "late" as const },
    ];
    const s = attendanceStats(rows);
    expect(s.present).toBe(1);
    expect(s.absent).toBe(1);
    expect(s.late).toBe(1);
    expect(s.total).toBe(3);
  });

  it("attendanceStatsForMonth skips short dates and wrong months", () => {
    const rows = [
      { attendance_date: "bad", status: "present" as const },
      { attendance_date: "2025-03-10", status: "present" as const },
    ];
    expect(attendanceStatsForMonth(rows, 2026, 3)).toEqual({
      attended: 0,
      total: 0,
    });
  });

  it("attendanceStatsForMonth filters by year and month", () => {
    const rows = [
      { attendance_date: "2026-03-10", status: "present" as const },
      { attendance_date: "2026-04-05", status: "present" as const },
    ];
    const m = attendanceStatsForMonth(rows, 2026, 3);
    expect(m.attended).toBe(1);
    expect(m.total).toBe(1);
  });

  it("returns zero streak when newest is absent", () => {
    const rows = [
      { attendance_date: "2026-03-01", status: "absent" as const },
      { attendance_date: "2026-02-01", status: "present" as const },
    ];
    expect(consecutivePresentStreak(rows)).toBe(0);
  });

  it("streak stops at first non-present from most recent", () => {
    const rows = [
      { attendance_date: "2026-03-01", status: "present" as const },
      { attendance_date: "2026-02-01", status: "absent" as const },
    ];
    expect(consecutivePresentStreak(rows)).toBe(1);
  });

  it("streak counts late as attended", () => {
    const rows = [
      { attendance_date: "2026-03-05", status: "late" as const },
      { attendance_date: "2026-03-04", status: "present" as const },
      { attendance_date: "2026-03-03", status: "absent" as const },
    ];
    expect(consecutivePresentStreak(rows)).toBe(2);
  });

  it("deprecated mandatoryAttendanceStats delegates to attendanceStats", () => {
    const rows = [
      { attendance_date: "2026-02-01", status: "present" as const },
    ];
    const s = mandatoryAttendanceStats(rows);
    expect(s.present).toBe(1);
    expect(s.total).toBe(1);
  });

  it("deprecated mandatoryAttendanceStatsForMonth delegates correctly", () => {
    const rows = [
      { attendance_date: "2026-03-10", status: "late" as const },
    ];
    const m = mandatoryAttendanceStatsForMonth(rows, 2026, 3);
    expect(m.present).toBe(1);
    expect(m.total).toBe(1);
  });
});
