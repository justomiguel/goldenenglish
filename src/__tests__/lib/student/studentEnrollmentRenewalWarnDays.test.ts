import { describe, it, expect } from "vitest";
import { getProperty, loadProperties } from "@/lib/theme/themeParser";
import { getStudentEnrollmentRenewalWarnDaysFromSystem } from "@/lib/student/studentEnrollmentRenewalWarnDays";

describe("getStudentEnrollmentRenewalWarnDaysFromSystem", () => {
  it("matches student.enrollment.renewal.warn.days in system.properties (clamped)", () => {
    const raw = getProperty(loadProperties(), "student.enrollment.renewal.warn.days", "300");
    const parsed = Number.parseInt(raw, 10);
    const expected =
      Number.isFinite(parsed) && parsed >= 1 && parsed <= 3650 ? parsed : 300;
    const n = getStudentEnrollmentRenewalWarnDaysFromSystem();
    expect(n).toBe(expected);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(3650);
  });
});
