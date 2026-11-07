/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  formatPaidWithMethod,
  parsePaidOn,
  parseStaffFeeAmount,
  paymentMethodSchema,
} from "@/lib/billing/paymentMethod";

const TODAY = "2026-11-06";

describe("parsePaidOn", () => {
  it("accepts today and a date inside the last year", () => {
    expect(parsePaidOn("2026-11-06", TODAY)).toBe("2026-11-06");
    expect(parsePaidOn("2025-11-06", TODAY)).toBe("2025-11-06");
  });

  it("rejects a future date, a date older than 366 days, and an invalid calendar day", () => {
    expect(parsePaidOn("2026-11-07", TODAY)).toBeNull();
    expect(parsePaidOn("2025-11-04", TODAY)).toBeNull();
    expect(parsePaidOn("2026-02-31", TODAY)).toBeNull();
    expect(parsePaidOn("06-11-2026", TODAY)).toBeNull();
    expect(parsePaidOn(undefined, TODAY)).toBeNull();
  });
});

describe("paymentMethodSchema", () => {
  it("accepts the five methods and rejects a blank value", () => {
    expect(paymentMethodSchema.safeParse("cash").success).toBe(true);
    expect(paymentMethodSchema.safeParse("gateway").success).toBe(true);
    expect(paymentMethodSchema.safeParse("efectivo").success).toBe(false);
  });
});

describe("parseStaffFeeAmount", () => {
  it("keeps a positive amount and rejects zero", () => {
    expect(parseStaffFeeAmount(15000.126)).toBe(15000.13);
    expect(parseStaffFeeAmount(0)).toBeNull();
    expect(parseStaffFeeAmount(-1)).toBeNull();
  });
});

describe("formatPaidWithMethod", () => {
  it("fills the method and a locale date", () => {
    expect(
      formatPaidWithMethod({
        template: "Paid {method} · {date}",
        methodLabel: "Cash",
        paidOn: "2026-03-12",
        locale: "en",
      }),
    ).toContain("Cash");
  });
});
