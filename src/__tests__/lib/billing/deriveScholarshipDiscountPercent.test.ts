import { describe, expect, it } from "vitest";
import {
  deriveScholarshipDiscountPercent,
  parseScholarshipPercentInput,
  roundScholarshipPercent,
} from "@/lib/billing/deriveScholarshipDiscountPercent";

describe("deriveScholarshipDiscountPercent", () => {
  it("parses percent mode without reference fee", () => {
    const r = deriveScholarshipDiscountPercent({
      referenceMonthlyAmount: null,
      mode: "percent",
      percentRaw: "25",
    });
    expect(r).toEqual({
      ok: true,
      discountPercent: 25,
      payableMonthly: 0,
      payableAnnual: 0,
    });
  });

  it("derives percent from monthly target amount", () => {
    const r = deriveScholarshipDiscountPercent({
      referenceMonthlyAmount: 1000,
      mode: "monthly_amount",
      monthlyAmountRaw: "500",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.discountPercent).toBe(50);
    expect(r.payableMonthly).toBe(500);
    expect(r.payableAnnual).toBe(6000);
  });

  it("derives percent from annual target amount", () => {
    const r = deriveScholarshipDiscountPercent({
      referenceMonthlyAmount: 1000,
      mode: "annual_amount",
      annualAmountRaw: "6000",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.discountPercent).toBe(50);
    expect(r.payableMonthly).toBe(500);
    expect(r.payableAnnual).toBe(6000);
  });

  it("rejects target above reference", () => {
    const r = deriveScholarshipDiscountPercent({
      referenceMonthlyAmount: 1000,
      mode: "monthly_amount",
      monthlyAmountRaw: "1001",
    });
    expect(r).toEqual({ ok: false, code: "target_above_reference" });
  });

  it("requires reference fee for amount modes", () => {
    const r = deriveScholarshipDiscountPercent({
      referenceMonthlyAmount: null,
      mode: "monthly_amount",
      monthlyAmountRaw: "500",
    });
    expect(r).toEqual({ ok: false, code: "missing_reference" });
  });
});

describe("parseScholarshipPercentInput", () => {
  it("accepts comma decimals", () => {
    expect(parseScholarshipPercentInput("12,5")).toBe(12.5);
  });
});

describe("roundScholarshipPercent", () => {
  it("rounds to two decimals", () => {
    expect(roundScholarshipPercent(33.333333)).toBe(33.33);
  });
});
