import { describe, expect, it } from "vitest";
import { enrollmentEligibleForAttendanceOnDate } from "@/lib/academics/sectionEnrollmentEligibleOnDate";

describe("enrollmentEligibleForAttendanceOnDate", () => {
  it("includes active enrollments after created", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate("2026-04-10", "2026-04-01T10:00:00Z", "active", "2026-04-15T10:00:00Z"),
    ).toBe(true);
  });

  it("excludes if created after class date", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate("2026-04-10", "2026-04-12T10:00:00Z", "active", "2026-04-15T10:00:00Z"),
    ).toBe(false);
  });

  it("includes dropped if left on or after class date", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate("2026-04-10", "2026-03-01T10:00:00Z", "dropped", "2026-04-10T15:00:00Z"),
    ).toBe(true);
  });

  it("excludes dropped if left before class date", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate("2026-04-10", "2026-03-01T10:00:00Z", "dropped", "2026-04-09T15:00:00Z"),
    ).toBe(false);
  });
});
