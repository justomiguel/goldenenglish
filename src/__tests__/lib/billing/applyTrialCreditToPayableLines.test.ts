/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { applyTrialCreditToPayableLines } from "@/lib/billing/applyTrialCreditToPayableLines";
import type { PayableParentMonthLine } from "@/lib/billing/listPayableParentMonthSections";

const line = (id: string, amount: number): PayableParentMonthLine => ({
  sectionId: id,
  sectionName: id,
  amount,
  currency: "CLP",
  scholarshipDiscountPercent: null,
});

describe("applyTrialCreditToPayableLines", () => {
  it("reduces lines in order and reports the leftover credit", () => {
    const result = applyTrialCreditToPayableLines({
      lines: [line("a", 10000), line("b", 40000)],
      creditAvailable: 15000,
      enabled: true,
    });
    expect(result.creditApplied).toBe(15000);
    expect(result.lines.map((l) => l.amount)).toEqual([0, 35000]);
    expect(result.total).toBe(35000);
  });

  it("leaves lines untouched when the policy is off", () => {
    const result = applyTrialCreditToPayableLines({
      lines: [line("a", 10000)],
      creditAvailable: 15000,
      enabled: false,
    });
    expect(result).toMatchObject({ creditApplied: 0, total: 10000 });
  });
});
