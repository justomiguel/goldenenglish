import { describe, expect, it } from "vitest";
import { parseStudentRenewalWarnDays } from "@/lib/student/parseStudentRenewalWarnDays";

describe("parseStudentRenewalWarnDays", () => {
  it("falls back to the canonical default when missing", () => {
    expect(parseStudentRenewalWarnDays(null)).toBe(300);
    expect(parseStudentRenewalWarnDays(undefined)).toBe(300);
    expect(parseStudentRenewalWarnDays({})).toBe(300);
  });

  it("parses numeric values inside the valid range", () => {
    expect(parseStudentRenewalWarnDays({ value: 7 })).toBe(7);
    expect(parseStudentRenewalWarnDays({ value: 365 })).toBe(365);
  });

  it("parses numeric strings", () => {
    expect(parseStudentRenewalWarnDays({ value: "180" })).toBe(180);
  });

  it("falls back when the value is out of range", () => {
    expect(parseStudentRenewalWarnDays({ value: 0 })).toBe(300);
    expect(parseStudentRenewalWarnDays({ value: 9999 })).toBe(300);
  });

  it("uses caller-provided default for valid range", () => {
    expect(parseStudentRenewalWarnDays(null, 90)).toBe(90);
  });
});
