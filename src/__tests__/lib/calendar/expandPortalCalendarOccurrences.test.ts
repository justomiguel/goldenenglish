// REGRESSION CHECK: Portal calendar expansion must respect section date windows and weekly slots.
import { describe, expect, it } from "vitest";
import {
  expandExamOccurrences,
  expandSectionClassOccurrences,
} from "@/lib/calendar/expandPortalCalendarOccurrences";

describe("expandSectionClassOccurrences", () => {
  it("emits one class per matching weekday in range", () => {
    const rows = expandSectionClassOccurrences(
      [
        {
          sectionId: "s1",
          cohortId: "c1",
          cohortLabel: "C1",
          teacherId: "t1",
          title: "C1 — Sec A",
          startsOn: "2025-04-14",
          endsOn: "2025-04-20",
          scheduleSlots: [{ dayOfWeek: 2, startTime: "10:00", endTime: "11:00" }],
        },
      ],
      "2025-04-13",
      "2025-04-21",
    );
    expect(rows.length).toBe(1);
    expect(rows[0]?.kind).toBe("class");
    expect(rows[0]?.icsUid).toContain("ge-class-s1");
  });
});

describe("expandExamOccurrences", () => {
  it("filters by view window", () => {
    const rows = expandExamOccurrences(
      [
        {
          assessmentId: "a1",
          cohortId: "c1",
          title: "Midterm",
          assessmentOn: "2025-06-01",
        },
      ],
      "2025-05-01",
      "2025-05-31",
    );
    expect(rows.length).toBe(0);
  });
});
