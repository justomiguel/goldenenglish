import { describe, expect, it } from "vitest";
import {
  mapBirthdayRowsToDashboardCard,
  mergeBirthdayCardDetails,
} from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";

describe("mapBirthdayRowsToDashboardCard", () => {
  it("starts without avatar or section, then merge fills both", () => {
    const mapped = mapBirthdayRowsToDashboardCard([
      {
        student_id: "s1",
        first_name: "Ada",
        last_name: "Lovelace",
        birth_date: "2001-08-22",
        celebration_date: "2026-08-22",
        is_celebration_today: true,
      },
    ]);

    expect(mapped[0]).toMatchObject({
      studentId: "s1",
      avatarUrl: null,
      sectionLabel: null,
    });

    const merged = mergeBirthdayCardDetails(
      mapped,
      new Map([["s1", { avatarUrl: "/a.png", sectionLabel: "A1" }]]),
    );
    expect(merged[0].avatarUrl).toBe("/a.png");
    expect(merged[0].sectionLabel).toBe("A1");
  });
});
