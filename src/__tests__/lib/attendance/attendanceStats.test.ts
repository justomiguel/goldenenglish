import { describe, it, expect } from "vitest";
import {
  attendanceStats,
  attendanceStatsForMonth,
  consecutivePresentStreak,
  type AttendanceRow,
} from "@/lib/attendance/stats";

function row(date: string, status: AttendanceRow["status"]): AttendanceRow {
  return { attendance_date: date, status };
}

describe("attendanceStats", () => {
  it("counts each status correctly", () => {
    const rows: AttendanceRow[] = [
      row("2026-03-01", "present"),
      row("2026-03-02", "absent"),
      row("2026-03-03", "late"),
      row("2026-03-04", "excused"),
      row("2026-03-05", "present"),
    ];
    const s = attendanceStats(rows);
    expect(s.present).toBe(2);
    expect(s.absent).toBe(1);
    expect(s.late).toBe(1);
    expect(s.excused).toBe(1);
    expect(s.total).toBe(5);
  });

  it("returns zeros for empty array", () => {
    const s = attendanceStats([]);
    expect(s.total).toBe(0);
    expect(s.present).toBe(0);
  });
});

describe("attendanceStatsForMonth", () => {
  const rows: AttendanceRow[] = [
    row("2026-03-10", "present"),
    row("2026-03-12", "late"),
    row("2026-03-15", "absent"),
    row("2026-04-01", "present"),
  ];

  it("filters by year and month", () => {
    const march = attendanceStatsForMonth(rows, 2026, 3);
    expect(march.total).toBe(3);
    expect(march.attended).toBe(2);
  });

  it("counts late as attended", () => {
    const march = attendanceStatsForMonth(rows, 2026, 3);
    expect(march.attended).toBe(2);
  });

  it("returns zero for months with no rows", () => {
    const jan = attendanceStatsForMonth(rows, 2026, 1);
    expect(jan.total).toBe(0);
    expect(jan.attended).toBe(0);
  });
});

describe("consecutivePresentStreak", () => {
  it("counts present + late from most recent backward", () => {
    const rows: AttendanceRow[] = [
      row("2026-03-01", "present"),
      row("2026-03-02", "absent"),
      row("2026-03-03", "present"),
      row("2026-03-04", "late"),
      row("2026-03-05", "present"),
    ];
    expect(consecutivePresentStreak(rows)).toBe(3);
  });

  it("returns 0 if most recent is absent", () => {
    const rows: AttendanceRow[] = [
      row("2026-03-01", "present"),
      row("2026-03-02", "absent"),
    ];
    expect(consecutivePresentStreak(rows)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(consecutivePresentStreak([])).toBe(0);
  });
});
