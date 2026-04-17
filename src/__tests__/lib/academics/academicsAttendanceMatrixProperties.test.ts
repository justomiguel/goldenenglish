import { describe, expect, it } from "vitest";
import {
  getAdminAttendanceMatrixFallbackLookbackDays,
  getAdminAttendanceMatrixMaxClassDays,
  getAttendanceMatrixHasEligibleWindowMaxScans,
  getAttendanceMatrixPickAdjacentCivilDays,
  getTeacherAttendanceFullCourseMaxClassDays,
  getTeacherAttendanceMatrixScanLookbackBufferDays,
  getTeacherAttendanceOperationalCivilLookbackDays,
  getTeacherAttendanceOperationalMaxClassDays,
} from "@/lib/academics/academicsAttendanceMatrixProperties";

describe("academicsAttendanceMatrixProperties", () => {
  it("exposes positive integers aligned with system.properties defaults", () => {
    expect(getTeacherAttendanceMatrixScanLookbackBufferDays()).toBeGreaterThanOrEqual(0);
    expect(getTeacherAttendanceOperationalCivilLookbackDays()).toBeGreaterThan(0);
    expect(getTeacherAttendanceOperationalMaxClassDays()).toBeGreaterThan(0);
    expect(getTeacherAttendanceFullCourseMaxClassDays()).toBeGreaterThan(0);
    expect(getAdminAttendanceMatrixFallbackLookbackDays()).toBeGreaterThan(0);
    expect(getAdminAttendanceMatrixMaxClassDays()).toBeGreaterThan(0);
    expect(getAttendanceMatrixPickAdjacentCivilDays()).toBeGreaterThan(0);
    expect(getAttendanceMatrixHasEligibleWindowMaxScans()).toBeGreaterThan(0);
  });
});
