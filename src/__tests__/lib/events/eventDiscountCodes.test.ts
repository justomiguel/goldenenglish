import { describe, expect, it } from "vitest";
import { applyEventCodeDiscount } from "@/lib/events/applyEventCodeDiscount";
import { generateEventDiscountCodes, EVENT_DISCOUNT_CODE_ALPHABET } from "@/lib/events/generateEventDiscountCodes";
import { parseEventDiscountCodeSheet } from "@/lib/events/parseEventDiscountCodeSheet";
import {
  clearEventDiscountCode,
  selectEventDiscountCode,
  selectEventFamilyDiscount,
} from "@/lib/events/resolveEventDiscountSelection";

describe("applyEventCodeDiscount", () => {
  it("takes a percent off and rounds CLP to a whole unit", () => {
    expect(applyEventCodeDiscount({ amount: 10000, percent: 10, currency: "CLP" })).toBe(9000);
    expect(applyEventCodeDiscount({ amount: 15, percent: 10, currency: "CLP" })).toBe(14);
  });

  it("rounds other currencies to two decimals", () => {
    expect(applyEventCodeDiscount({ amount: 10, percent: 10, currency: "USD" })).toBe(9);
    expect(applyEventCodeDiscount({ amount: 10.05, percent: 10, currency: "USD" })).toBe(9.05);
  });

  it("returns 0 for a 100 percent code", () => {
    expect(applyEventCodeDiscount({ amount: 25000, percent: 100, currency: "CLP" })).toBe(0);
  });
});

describe("parseEventDiscountCodeSheet", () => {
  it("skips a text header and accepts N as no cap", () => {
    const result = parseEventDiscountCodeSheet([
      ["code", "uses", "percent"],
      ["SAVE10", "N", "10"],
      ["SAVE20", "2", "20"],
    ]);
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { code: "SAVE10", maxUses: null, discountPercent: 10 },
      { code: "SAVE20", maxUses: 2, discountPercent: 20 },
    ]);
  });

  it("keeps the first duplicate and reports the later row", () => {
    const result = parseEventDiscountCodeSheet([
      ["Ab", "1", "10"],
      ["ab", "2", "20"],
      ["OTHER", "n", "5"],
    ]);
    expect(result.rows.map((row) => row.code)).toEqual(["Ab", "OTHER"]);
    expect(result.errors).toEqual([{ row: 2, code: "duplicate" }]);
  });

  it("reports a bad percent and a cap below occupied uses", () => {
    const result = parseEventDiscountCodeSheet(
      [
        ["OK", "3", "101"],
        ["USED", "1", "10"],
      ],
      new Map([["used", 2]]),
    );
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      { row: 1, code: "bad_percent" },
      { row: 2, code: "cap_below_occupied" },
    ]);
  });

  it("rejects an empty file", () => {
    expect(parseEventDiscountCodeSheet([]).errors).toEqual([{ row: 0, code: "empty_file" }]);
    expect(parseEventDiscountCodeSheet([["code", "uses", "percent"]]).errors).toEqual([
      { row: 1, code: "empty_file" },
    ]);
  });
});

describe("generateEventDiscountCodes", () => {
  it("builds 8-character codes from the allowed alphabet", () => {
    let step = 0;
    const result = generateEventDiscountCodes({
      quantity: 2,
      random: () => {
        step += 1;
        return (step % 31) / 32;
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.codes).toHaveLength(2);
    for (const code of result.codes) {
      expect(code).toHaveLength(8);
      for (const char of code) expect(EVENT_DISCOUNT_CODE_ALPHABET).toContain(char);
    }
  });

  it("rejects a quantity above 200", () => {
    expect(generateEventDiscountCodes({ quantity: 201 })).toEqual({ ok: false, code: "quantity" });
  });

  it("retries when the code already exists", () => {
    let call = 0;
    const result = generateEventDiscountCodes({
      quantity: 1,
      existing: new Set(["aaaaaaaa"]),
      random: () => {
        call += 1;
        return call <= 8 ? 0 : 0.2;
      },
    });
    expect(result).toEqual({ ok: true, codes: ["GGGGGGGG"] });
  });
});

describe("discount selection", () => {
  it("clears the code when the family discount is checked", () => {
    expect(selectEventFamilyDiscount(true, { code: "SAVE", amount: 900 })).toEqual({
      family: true,
      applied: null,
    });
  });

  it("clears the family checkbox when a code is applied", () => {
    expect(selectEventDiscountCode({ code: "SAVE", amount: 900 })).toEqual({
      family: false,
      applied: { code: "SAVE", amount: 900 },
    });
  });

  it("clears only the code", () => {
    expect(clearEventDiscountCode(false)).toEqual({ family: false, applied: null });
  });
});
