import { describe, it, expect } from "vitest";
import { buildParentAttendanceSectionSummaries } from "@/lib/parent/buildParentAttendanceSectionSummaries";
import { DEFAULT_MIN_ATTENDANCE_PERCENT } from "@/lib/academics/resolveSectionMinAttendancePercent";

describe("buildParentAttendanceSectionSummaries", () => {
  it("computes monthly percent and level per active enrollment", () => {
    const enrollmentMeta = new Map([
      [
        "enr-1",
        {
          studentId: "s1",
          studentName: "Ana Beta",
          sectionId: "sec-a",
          sectionName: "Kids A",
        },
      ],
    ]);
    const rowsByEnrollment = new Map([
      [
        "enr-1",
        [
          { attended_on: "2026-05-10", status: "present" },
          { attended_on: "2026-05-08", status: "absent" },
        ],
      ],
    ]);

    const summaries = buildParentAttendanceSectionSummaries(
      enrollmentMeta,
      rowsByEnrollment,
      2026,
      5,
      DEFAULT_MIN_ATTENDANCE_PERCENT,
    );

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.monthPercent).toBe(50);
    expect(summaries[0]?.sessionsThisMonth).toBe(2);
    expect(summaries[0]?.requiredMinPercent).toBe(DEFAULT_MIN_ATTENDANCE_PERCENT);
    expect(summaries[0]?.level).toBe("attention");
  });

  it("applies per-section override when provided", () => {
    const enrollmentMeta = new Map([
      [
        "enr-1",
        {
          studentId: "s1",
          studentName: "Ana Beta",
          sectionId: "sec-a",
          sectionName: "Kids A",
        },
      ],
    ]);
    const rowsByEnrollment = new Map([
      [
        "enr-1",
        [
          { attended_on: "2026-05-10", status: "present" },
          { attended_on: "2026-05-08", status: "present" },
        ],
      ],
    ]);
    const overrides = new Map<string, number | null>([["sec-a", 90]]);

    const summaries = buildParentAttendanceSectionSummaries(
      enrollmentMeta,
      rowsByEnrollment,
      2026,
      5,
      75,
      overrides,
    );

    expect(summaries[0]?.requiredMinPercent).toBe(90);
    expect(summaries[0]?.level).toBe("ok");
  });
});
