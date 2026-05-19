import { describe, it, expect } from "vitest";
import { resolveParentAttendanceChildOptions } from "@/lib/parent/resolveParentAttendanceChildOptions";

describe("resolveParentAttendanceChildOptions", () => {
  it("merges linked children and students from section summaries", () => {
    const options = resolveParentAttendanceChildOptions({
      children: [{ studentId: "s1", studentName: "Ana Beta" }],
      marks: [],
      sectionSummaries: [
        {
          studentId: "s2",
          studentName: "Bruno Alpha",
          sectionId: "sec-b",
          sectionName: "Kids B",
          monthPercent: 80,
          sessionsThisMonth: 3,
          requiredMinPercent: 75,
          level: "ok",
        },
      ],
      requiredMinPercent: 75,
    });

    expect(options).toHaveLength(2);
    expect(options.map((o) => o.studentId).sort()).toEqual(["s1", "s2"]);
  });
});
