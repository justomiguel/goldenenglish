import { describe, it, expect } from "vitest";
import { listTeacherTodayClassesUtc } from "@/lib/academics/teacherDashboardTodayClassesUtc";

describe("listTeacherTodayClassesUtc", () => {
  it("lists slots matching UTC weekday", () => {
    const thursdayUtc = new Date(Date.UTC(2026, 3, 16, 12, 0, 0));
    expect(thursdayUtc.getUTCDay()).toBe(4);
    const rows = listTeacherTodayClassesUtc(
      [
        {
          id: "sec-a",
          name: "Alpha",
          cohortName: "C1",
          schedule_slots: [{ dayOfWeek: 4, startTime: "09:00", endTime: "10:30" }],
        },
        {
          id: "sec-b",
          name: "Beta",
          cohortName: "",
          schedule_slots: [{ dayOfWeek: 3, startTime: "11:00", endTime: "12:00" }],
        },
      ],
      thursdayUtc,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].sectionId).toBe("sec-a");
    expect(rows[0].label).toBe("C1 — Alpha");
    expect(rows[0].startTime).toBe("09:00");
  });

  it("sorts by start time", () => {
    const mondayUtc = new Date(Date.UTC(2026, 3, 13, 8, 0, 0));
    expect(mondayUtc.getUTCDay()).toBe(1);
    const rows = listTeacherTodayClassesUtc(
      [
        {
          id: "late",
          name: "L",
          cohortName: "",
          schedule_slots: [{ dayOfWeek: 1, startTime: "14:00", endTime: "15:00" }],
        },
        {
          id: "early",
          name: "E",
          cohortName: "",
          schedule_slots: [{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }],
        },
      ],
      mondayUtc,
    );
    expect(rows.map((r) => r.sectionId)).toEqual(["early", "late"]);
  });
});
