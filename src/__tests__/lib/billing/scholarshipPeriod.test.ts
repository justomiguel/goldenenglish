import { describe, expect, it } from "vitest";
import {
  effectiveAmountAfterScholarship,
  effectiveScholarshipPercentForPeriod,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";

const base: ScholarshipRow = {
  id: "sch-1",
  discount_percent: 20,
  note: null,
  valid_from_year: 2026,
  valid_from_month: 1,
  valid_until_year: 2026,
  valid_until_month: 12,
  is_active: true,
};

describe("scholarshipPeriod", () => {
  it("sums active scholarships covering the same month", () => {
    expect(
      effectiveScholarshipPercentForPeriod(
        [base, { ...base, id: "sch-2", discount_percent: 30 }],
        2026,
        5,
      ),
    ).toBe(50);
  });

  it("caps accumulated scholarship percentage at 100", () => {
    expect(
      effectiveScholarshipPercentForPeriod(
        [base, { ...base, id: "sch-2", discount_percent: 90 }],
        2026,
        5,
      ),
    ).toBe(100);
  });

  it("ignores inactive and out-of-range scholarships", () => {
    expect(
      effectiveScholarshipPercentForPeriod(
        [
          { ...base, is_active: false },
          { ...base, id: "sch-2", valid_from_month: 8, discount_percent: 40 },
        ],
        2026,
        5,
      ),
    ).toBe(0);
  });

  it("uses the accumulated percentage in expected amounts", () => {
    expect(
      effectiveAmountAfterScholarship(
        100,
        2026,
        5,
        [base, { ...base, id: "sch-2", discount_percent: 30 }],
      ),
    ).toBe(50);
  });
});
