import { describe, expect, it } from "vitest";
import { prorateMonthlyFee } from "@/lib/billing/prorateMonthlyFee";

describe("prorateMonthlyFee", () => {
  it("returns out_of_period when the section had no classes that month", () => {
    expect(
      prorateMonthlyFee({
        monthlyFee: 100,
        totalClassesInMonth: 0,
        availableClassesForStudent: 0,
      }),
    ).toEqual({ code: "out_of_period" });
  });

  it("returns out_of_period when the student had no classes available", () => {
    expect(
      prorateMonthlyFee({
        monthlyFee: 100,
        totalClassesInMonth: 4,
        availableClassesForStudent: 0,
      }),
    ).toEqual({ code: "out_of_period" });
  });

  it("returns full fee when student had every class available", () => {
    expect(
      prorateMonthlyFee({
        monthlyFee: 100,
        totalClassesInMonth: 4,
        availableClassesForStudent: 4,
      }),
    ).toEqual({
      code: "ok",
      amount: 100,
      numerator: 4,
      denominator: 4,
      full: true,
    });
  });

  it("clamps to full fee when available exceeds total", () => {
    expect(
      prorateMonthlyFee({
        monthlyFee: 100,
        totalClassesInMonth: 4,
        availableClassesForStudent: 5,
      }),
    ).toEqual({
      code: "ok",
      amount: 100,
      numerator: 4,
      denominator: 4,
      full: true,
    });
  });

  it("prorates linearly with 2-decimal financial rounding", () => {
    // 100 * 1/4 = 25
    expect(
      prorateMonthlyFee({
        monthlyFee: 100,
        totalClassesInMonth: 4,
        availableClassesForStudent: 1,
      }),
    ).toEqual({
      code: "ok",
      amount: 25,
      numerator: 1,
      denominator: 4,
      full: false,
    });
    // 100 * 2/3 = 66.666... → 66.67
    expect(
      prorateMonthlyFee({
        monthlyFee: 100,
        totalClassesInMonth: 3,
        availableClassesForStudent: 2,
      }).code === "ok" &&
        prorateMonthlyFee({
          monthlyFee: 100,
          totalClassesInMonth: 3,
          availableClassesForStudent: 2,
        }),
    ).toMatchObject({ amount: 66.67 });
  });

  it("rejects negative or non-finite monthlyFee", () => {
    expect(
      prorateMonthlyFee({
        monthlyFee: -1,
        totalClassesInMonth: 4,
        availableClassesForStudent: 4,
      }),
    ).toEqual({ code: "out_of_period" });
    expect(
      prorateMonthlyFee({
        monthlyFee: Number.NaN,
        totalClassesInMonth: 4,
        availableClassesForStudent: 4,
      }),
    ).toEqual({ code: "out_of_period" });
  });
});
