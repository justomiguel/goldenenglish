import { describe, it, expect } from "vitest";
import {
  resolveClassPackPrice,
  listClassPackTiersForPeriod,
} from "@/lib/billing/resolveClassPackPrice";
import type { ClassPackPrice } from "@/types/classPack";

function price(over: Partial<ClassPackPrice> & { classCount: number; amount: number }): ClassPackPrice {
  return {
    id: `p${over.classCount}-${over.amount}`,
    effectiveFromYear: 2026,
    effectiveFromMonth: 1,
    currency: "ARS",
    archivedAt: null,
    ...over,
  };
}

// A non-linear table on purpose: 2 classes cost less than 2x one class, 4 less than 2x two.
const catalog: ClassPackPrice[] = [
  price({ classCount: 1, amount: 10000 }),
  price({ classCount: 2, amount: 18000 }),
  price({ classCount: 4, amount: 32000 }),
  price({ classCount: 8, amount: 56000 }),
];

// REGRESSION CHECK: there is NO interpolation between tiers. A class count without a row must be a
// typed error, never a computed price. If this starts returning an interpolated amount, institutes
// will silently charge amounts nobody put in the catalog.

describe("resolveClassPackPrice", () => {
  it("returns the total price of the requested tier", () => {
    const res = resolveClassPackPrice(catalog, 4, 2026, 5);
    expect(res).toEqual({ code: "ok", amount: 32000, currency: "ARS", priceId: "p4-32000" });
  });

  it("prices each tier independently, so the table can be non-linear", () => {
    const one = resolveClassPackPrice(catalog, 1, 2026, 5);
    const two = resolveClassPackPrice(catalog, 2, 2026, 5);
    expect(one).toMatchObject({ code: "ok", amount: 10000 });
    expect(two).toMatchObject({ code: "ok", amount: 18000 });
    // The whole point: two classes are not twice one class.
    expect(two).not.toMatchObject({ amount: 20000 });
  });

  it("rejects a class count that has no tier instead of interpolating", () => {
    expect(resolveClassPackPrice(catalog, 3, 2026, 5)).toEqual({ code: "no_tier" });
    expect(resolveClassPackPrice(catalog, 12, 2026, 5)).toEqual({ code: "no_tier" });
  });

  it("rejects non-positive and non-integer class counts", () => {
    expect(resolveClassPackPrice(catalog, 0, 2026, 5)).toEqual({ code: "no_tier" });
    expect(resolveClassPackPrice(catalog, -2, 2026, 5)).toEqual({ code: "no_tier" });
    expect(resolveClassPackPrice(catalog, 2.5, 2026, 5)).toEqual({ code: "no_tier" });
  });

  it("returns no_tier when the catalog is empty", () => {
    expect(resolveClassPackPrice([], 1, 2026, 5)).toEqual({ code: "no_tier" });
  });

  it("returns no_tier for a period before any effectivity window", () => {
    expect(resolveClassPackPrice(catalog, 1, 2025, 12)).toEqual({ code: "no_tier" });
  });

  it("uses the newest effectivity window that already applies", () => {
    const withRaise: ClassPackPrice[] = [
      ...catalog,
      price({ classCount: 1, amount: 13000, effectiveFromMonth: 7 }),
      price({ classCount: 2, amount: 24000, effectiveFromMonth: 7 }),
    ];
    expect(resolveClassPackPrice(withRaise, 1, 2026, 6)).toMatchObject({ amount: 10000 });
    expect(resolveClassPackPrice(withRaise, 1, 2026, 7)).toMatchObject({ amount: 13000 });
  });

  it("does not fall back to an older window for a tier the new window dropped", () => {
    // July only re-priced 1 and 2. The 4-class tier was intentionally discontinued.
    const withRaise: ClassPackPrice[] = [
      ...catalog,
      price({ classCount: 1, amount: 13000, effectiveFromMonth: 7 }),
      price({ classCount: 2, amount: 24000, effectiveFromMonth: 7 }),
    ];
    expect(resolveClassPackPrice(withRaise, 4, 2026, 7)).toEqual({ code: "no_tier" });
  });

  it("ignores archived tiers", () => {
    const archived: ClassPackPrice[] = [
      price({ classCount: 1, amount: 10000, archivedAt: "2026-03-01T00:00:00Z" }),
    ];
    expect(resolveClassPackPrice(archived, 1, 2026, 5)).toEqual({ code: "no_tier" });
  });
});

describe("listClassPackTiersForPeriod", () => {
  it("lists the effective tiers sorted by class count", () => {
    const shuffled = [catalog[2], catalog[0], catalog[3], catalog[1]];
    expect(listClassPackTiersForPeriod(shuffled, 2026, 5).map((t) => t.classCount)).toEqual([
      1, 2, 4, 8,
    ]);
  });

  it("excludes archived tiers", () => {
    const withArchived: ClassPackPrice[] = [
      ...catalog,
      price({ classCount: 16, amount: 99000, archivedAt: "2026-04-01T00:00:00Z" }),
    ];
    expect(listClassPackTiersForPeriod(withArchived, 2026, 5).map((t) => t.classCount)).toEqual([
      1, 2, 4, 8,
    ]);
  });

  it("returns an empty list before any window applies", () => {
    expect(listClassPackTiersForPeriod(catalog, 2025, 1)).toEqual([]);
  });
});
