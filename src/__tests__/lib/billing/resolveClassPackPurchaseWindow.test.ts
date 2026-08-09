import { describe, it, expect } from "vitest";
import { resolveClassPackPurchaseWindow } from "@/lib/billing/resolveClassPackPurchaseWindow";

const current = { year: 2026, month: 5 };

// REGRESSION CHECK: the rule lives here and nowhere else, so the portal action and the admin action
// stay consistent. Letting a family buy a past month would let them backfill credits for classes
// already attended and already in debt.

describe("resolveClassPackPurchaseWindow", () => {
  it("lets a family buy the current month", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2026, month: 5 }, current, actor: "family" }),
    ).toEqual({ allowed: true });
  });

  it("lets a family buy a future month in the same year", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2026, month: 9 }, current, actor: "family" }),
    ).toEqual({ allowed: true });
  });

  it("lets a family buy a month in a following year", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2027, month: 1 }, current, actor: "family" }),
    ).toEqual({ allowed: true });
  });

  it("refuses a past month for a family", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2026, month: 4 }, current, actor: "family" }),
    ).toEqual({ allowed: false, reason: "past_period" });
  });

  it("refuses the same month of a past year for a family", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2025, month: 5 }, current, actor: "family" }),
    ).toEqual({ allowed: false, reason: "past_period" });
  });

  it("lets staff record a past month, which is what reconciliation needs", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2025, month: 11 }, current, actor: "staff" }),
    ).toEqual({ allowed: true });
  });

  it("refuses an out-of-range month for anybody", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2026, month: 13 }, current, actor: "staff" }),
    ).toEqual({ allowed: false, reason: "invalid_period" });
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2026, month: 0 }, current, actor: "family" }),
    ).toEqual({ allowed: false, reason: "invalid_period" });
  });

  it("refuses a non-integer or out-of-range year for anybody", () => {
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 1999, month: 5 }, current, actor: "staff" }),
    ).toEqual({ allowed: false, reason: "invalid_period" });
    expect(
      resolveClassPackPurchaseWindow({ target: { year: 2026.5, month: 5 }, current, actor: "staff" }),
    ).toEqual({ allowed: false, reason: "invalid_period" });
  });
});
