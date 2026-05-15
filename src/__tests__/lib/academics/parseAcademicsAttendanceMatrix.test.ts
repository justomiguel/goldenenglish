import { describe, expect, it } from "vitest";
import {
  ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS,
  parseAcademicsAttendanceMatrix,
} from "@/lib/academics/parseAcademicsAttendanceMatrix";

describe("parseAcademicsAttendanceMatrix", () => {
  it("returns canonical defaults when row is missing", () => {
    expect(parseAcademicsAttendanceMatrix(null)).toEqual(
      ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS,
    );
  });

  it("parses partial overrides and keeps defaults for missing keys", () => {
    const parsed = parseAcademicsAttendanceMatrix({
      teacher: { operationalCivilLookbackDays: 30 },
    });
    expect(parsed.teacher.operationalCivilLookbackDays).toBe(30);
    expect(parsed.teacher.scanLookbackBufferDays).toBe(
      ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS.teacher.scanLookbackBufferDays,
    );
    expect(parsed.admin).toEqual(ACADEMICS_ATTENDANCE_MATRIX_DEFAULTS.admin);
  });

  it("clamps out-of-range values to the bounds", () => {
    const parsed = parseAcademicsAttendanceMatrix({
      teacher: { scanLookbackBufferDays: 9999 },
      admin: { maxClassDays: 1 },
    });
    expect(parsed.teacher.scanLookbackBufferDays).toBe(31);
    expect(parsed.admin.maxClassDays).toBe(50);
  });

  it("parses numeric strings", () => {
    const parsed = parseAcademicsAttendanceMatrix({
      pickAdjacentCivilDays: "20",
    });
    expect(parsed.pickAdjacentCivilDays).toBe(20);
  });
});
