import { describe, it, expect } from "vitest";
import {
  consecutivePresentStreak,
  mandatoryAttendanceStats,
} from "@/lib/attendance/stats";

describe("attendance stats", () => {
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
