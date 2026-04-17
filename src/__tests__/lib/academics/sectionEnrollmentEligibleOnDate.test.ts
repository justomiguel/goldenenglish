import { describe, expect, it } from "vitest";
import { enrollmentEligibleForAttendanceOnDate } from "@/lib/academics/sectionEnrollmentEligibleOnDate";

describe("enrollmentEligibleForAttendanceOnDate", () => {
  it("includes active enrollments after created", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate("2026-04-10", "2026-04-01T10:00:00Z", "active", "2026-04-15T10:00:00Z"),
    ).toBe(true);
  });

  it("excludes active if created after class date and no section start hint is given", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate("2026-04-10", "2026-04-12T10:00:00Z", "active", "2026-04-15T10:00:00Z"),
    ).toBe(false);
  });

  it("includes active for class days on/after section.starts_on even when enrollment was created later (mid-term onboarding)", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate(
        "2026-04-10",
        "2026-04-15T10:00:00Z",
        "active",
        "2026-04-15T10:00:00Z",
        { sectionStartsOn: "2026-04-01" },
      ),
    ).toBe(true);
  });

  it("excludes active for class days strictly before section.starts_on", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate(
        "2026-03-30",
        "2026-04-15T10:00:00Z",
        "active",
        "2026-04-15T10:00:00Z",
        { sectionStartsOn: "2026-04-01" },
      ),
    ).toBe(false);
  });

  it("falls back to created_at when section.starts_on is missing", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate(
        "2026-04-10",
        "2026-04-12T10:00:00Z",
        "active",
        "2026-04-15T10:00:00Z",
        { sectionStartsOn: null },
      ),
    ).toBe(false);
  });

  it("does NOT widen the floor for transferred enrollments (transfer date is the real start in this section)", () => {
    expect(
      enrollmentEligibleForAttendanceOnDate(
        "2026-03-15",
        "2026-04-10T10:00:00Z",
        "transferred",
        "2026-04-12T10:00:00Z",
        { sectionStartsOn: "2026-03-01" },
      ),
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
