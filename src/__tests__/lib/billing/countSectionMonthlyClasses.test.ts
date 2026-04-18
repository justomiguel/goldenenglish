import { describe, expect, it } from "vitest";
import {
  countSectionMonthlyClasses,
  intersectDateRange,
  monthBounds,
} from "@/lib/billing/countSectionMonthlyClasses";

const tueThu = [
  { dayOfWeek: 2, startTime: "18:00", endTime: "19:30" },
  { dayOfWeek: 4, startTime: "18:00", endTime: "19:30" },
];

describe("monthBounds", () => {
  it("returns first/last day of the month in UTC", () => {
    const r = monthBounds(2026, 5);
    expect(r.from.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(r.until.toISOString()).toBe("2026-05-31T00:00:00.000Z");
  });

  it("handles February in leap years", () => {
    const r = monthBounds(2024, 2);
    expect(r.until.toISOString()).toBe("2024-02-29T00:00:00.000Z");
  });
});

describe("intersectDateRange", () => {
  it("returns null when ranges do not overlap", () => {
    expect(
      intersectDateRange(
        { from: new Date(Date.UTC(2026, 0, 1)), until: new Date(Date.UTC(2026, 0, 31)) },
        { from: new Date(Date.UTC(2026, 1, 1)), until: new Date(Date.UTC(2026, 1, 28)) },
      ),
    ).toBeNull();
  });

  it("returns the inner overlap when they intersect", () => {
    const r = intersectDateRange(
      { from: new Date(Date.UTC(2026, 4, 1)), until: new Date(Date.UTC(2026, 4, 31)) },
      { from: new Date(Date.UTC(2026, 4, 15)), until: new Date(Date.UTC(2026, 5, 15)) },
    );
    expect(r?.from.toISOString()).toBe("2026-05-15T00:00:00.000Z");
    expect(r?.until.toISOString()).toBe("2026-05-31T00:00:00.000Z");
  });
});

describe("countSectionMonthlyClasses", () => {
  it("returns 0 when no schedule slots are configured", () => {
    expect(
      countSectionMonthlyClasses({
        scheduleSlots: [],
        from: new Date(Date.UTC(2026, 4, 1)),
        until: new Date(Date.UTC(2026, 4, 31)),
      }),
    ).toBe(0);
  });

  it("counts every Tuesday and Thursday in May 2026 (8)", () => {
    expect(
      countSectionMonthlyClasses({
        scheduleSlots: tueThu,
        from: new Date(Date.UTC(2026, 4, 1)),
        until: new Date(Date.UTC(2026, 4, 31)),
      }),
    ).toBe(8);
  });

  it("counts only the days inside a partial window", () => {
    // From May 20 (Wed) through May 31 → Tue 26, Thu 21, Thu 28 → 3 classes
    expect(
      countSectionMonthlyClasses({
        scheduleSlots: tueThu,
        from: new Date(Date.UTC(2026, 4, 20)),
        until: new Date(Date.UTC(2026, 4, 31)),
      }),
    ).toBe(3);
  });

  it("returns 0 when until < from", () => {
    expect(
      countSectionMonthlyClasses({
        scheduleSlots: tueThu,
        from: new Date(Date.UTC(2026, 4, 31)),
        until: new Date(Date.UTC(2026, 4, 1)),
      }),
    ).toBe(0);
  });

  it("ignores duplicate weekdays in the schedule", () => {
    // Two Tuesday slots collapse to one Tuesday-per-week.
    expect(
      countSectionMonthlyClasses({
        scheduleSlots: [
          { dayOfWeek: 2, startTime: "10:00", endTime: "11:30" },
          { dayOfWeek: 2, startTime: "18:00", endTime: "19:30" },
        ],
        from: new Date(Date.UTC(2026, 4, 1)),
        until: new Date(Date.UTC(2026, 4, 31)),
      }),
    ).toBe(4);
  });
});
