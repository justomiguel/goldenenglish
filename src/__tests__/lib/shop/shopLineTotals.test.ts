/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { sumShopLines } from "@/lib/shop/shopLineTotals";

describe("sumShopLines", () => {
  it("sums quantity * unitPrice", () => {
    expect(
      sumShopLines([
        { quantity: 2, unitPrice: 1500 },
        { quantity: 1, unitPrice: 500 },
      ]),
    ).toBe(3500);
  });
  it("rejects non-positive quantity or price", () => {
    expect(() => sumShopLines([{ quantity: 0, unitPrice: 1 }])).toThrow("invalid_line");
  });
});
