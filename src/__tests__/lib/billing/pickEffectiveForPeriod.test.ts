import { describe, it, expect } from "vitest";
import { pickEffectiveForPeriod } from "@/lib/billing/pickEffectiveForPeriod";

type Row = { id: string; y: number; m: number };

const getPeriod = (r: Row) => ({ year: r.y, month: r.m });

// REGRESSION CHECK: `resolveEffectiveSectionFeePlan` now delegates its selection to this helper.
// Changing which item wins here changes which monthly fee a student is charged.

describe("pickEffectiveForPeriod", () => {
  it("returns an empty list when there are no items", () => {
    expect(pickEffectiveForPeriod([], { year: 2026, month: 5 }, getPeriod)).toEqual([]);
  });

  it("returns an empty list when every item starts after the target period", () => {
    const rows: Row[] = [{ id: "a", y: 2026, m: 6 }];
    expect(pickEffectiveForPeriod(rows, { year: 2026, month: 5 }, getPeriod)).toEqual([]);
  });

  it("picks the most recent period that is not in the future", () => {
    const rows: Row[] = [
      { id: "jan", y: 2026, m: 1 },
      { id: "jun", y: 2026, m: 6 },
    ];
    expect(pickEffectiveForPeriod(rows, { year: 2026, month: 5 }, getPeriod).map((r) => r.id)).toEqual([
      "jan",
    ]);
    expect(pickEffectiveForPeriod(rows, { year: 2026, month: 6 }, getPeriod).map((r) => r.id)).toEqual([
      "jun",
    ]);
    expect(pickEffectiveForPeriod(rows, { year: 2027, month: 1 }, getPeriod).map((r) => r.id)).toEqual([
      "jun",
    ]);
  });

  it("returns every item sharing the winning period, which is what a price table needs", () => {
    const rows: Row[] = [
      { id: "old-1", y: 2026, m: 1 },
      { id: "new-1", y: 2026, m: 3 },
      { id: "new-2", y: 2026, m: 3 },
      { id: "new-4", y: 2026, m: 3 },
    ];
    const winners = pickEffectiveForPeriod(rows, { year: 2026, month: 9 }, getPeriod);
    expect(winners.map((r) => r.id)).toEqual(["new-1", "new-2", "new-4"]);
  });

  it("compares across year boundaries, not by month alone", () => {
    const rows: Row[] = [
      { id: "dec-2025", y: 2025, m: 12 },
      { id: "feb-2026", y: 2026, m: 2 },
    ];
    expect(
      pickEffectiveForPeriod(rows, { year: 2026, month: 1 }, getPeriod).map((r) => r.id),
    ).toEqual(["dec-2025"]);
  });
});
