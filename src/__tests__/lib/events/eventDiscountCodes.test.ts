import { describe, expect, it } from "vitest";
import { applyEventCodeDiscount } from "@/lib/events/applyEventCodeDiscount";
import { applyEventFixedAmountDiscount } from "@/lib/events/applyEventFixedAmountDiscount";
import { generateEventDiscountCodes, EVENT_DISCOUNT_CODE_ALPHABET } from "@/lib/events/generateEventDiscountCodes";
import { parseEventDiscountCodeSheet } from "@/lib/events/parseEventDiscountCodeSheet";
import { buildEventDiscountCodesXlsx } from "@/lib/events/export/buildEventDiscountCodesXlsx";
import { readDiscountCodeMatrix } from "@/lib/events/readDiscountCodeMatrix";
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

describe("applyEventFixedAmountDiscount", () => {
  it("prices two covered tickets and leaves the extra ticket at full price", () => {
    expect(
      applyEventFixedAmountDiscount({
        unitPrice: 10000,
        seats: 3,
        discountAmount: 2000,
        ticketCount: 2,
        currency: "CLP",
      }),
    ).toEqual({ covered: 2, extra: 1, newUnit: 8000, total: 26000 });
  });

  it("covers every seat when the person buys fewer tickets than the code allows", () => {
    expect(
      applyEventFixedAmountDiscount({
        unitPrice: 10000,
        seats: 1,
        discountAmount: 2000,
        ticketCount: 2,
        currency: "CLP",
      }).total,
    ).toBe(8000);
  });

  it("does not let the new unit go below 0", () => {
    expect(
      applyEventFixedAmountDiscount({
        unitPrice: 1500,
        seats: 2,
        discountAmount: 2000,
        ticketCount: 2,
        currency: "CLP",
      }),
    ).toEqual({ covered: 2, extra: 0, newUnit: 0, total: 0 });
  });

  it("rounds a CLP new unit to a whole number", () => {
    expect(
      applyEventFixedAmountDiscount({
        unitPrice: 1000,
        seats: 1,
        discountAmount: 10.4,
        ticketCount: 1,
        currency: "CLP",
      }).newUnit,
    ).toBe(990);
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
      { code: "SAVE10", maxUses: null, kind: "percent", discountPercent: 10 },
      { code: "SAVE20", maxUses: 2, kind: "percent", discountPercent: 20 },
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

  it("skips example rows and still reads an old three-column percent file", () => {
    const withExamples = parseEventDiscountCodeSheet([
      ["code", "uses", "percent", "example"],
      ["EJEMPLO10", "20", "10", "yes"],
      ["SAVE10", "N", "15", ""],
    ]);
    expect(withExamples.errors).toEqual([]);
    expect(withExamples.rows).toEqual([
      { code: "SAVE10", maxUses: null, kind: "percent", discountPercent: 15 },
    ]);

    const legacy = parseEventDiscountCodeSheet([
      ["SAVE10", "2", "10"],
    ]);
    expect(legacy.rows).toEqual([
      { code: "SAVE10", maxUses: 2, kind: "percent", discountPercent: 10 },
    ]);
  });

  it("returns examples_only when every data row is an example", () => {
    const result = parseEventDiscountCodeSheet(
      [
        ["code", "uses", "amount", "tickets", "example"],
        ["EJEMPLO2000", "10", "2000", "2", "yes"],
        ["EJEMPLO500", "N", "500", "1", "si"],
      ],
      new Map(),
      { kind: "amount", currency: "CLP" },
    );
    expect(result).toEqual({ rows: [], errors: [{ row: 2, code: "examples_only" }] });
  });

  it("rejects the other mode header and a fractional CLP amount", () => {
    expect(
      parseEventDiscountCodeSheet(
        [
          ["code", "uses", "percent"],
          ["SAVE10", "1", "10"],
        ],
        new Map(),
        { kind: "amount" },
      ).errors,
    ).toEqual([{ row: 1, code: "wrong_file" }]);

    const fractional = parseEventDiscountCodeSheet(
      [
        ["code", "uses", "amount", "tickets", "example"],
        ["SAVE", "1", "10.5", "1", ""],
      ],
      new Map(),
      { kind: "amount", currency: "CLP" },
    );
    expect(fractional.rows).toEqual([]);
    expect(fractional.errors).toEqual([{ row: 2, code: "bad_amount" }]);
  });

  it("reads a fixed-amount row", () => {
    const result = parseEventDiscountCodeSheet(
      [
        ["code", "uses", "amount", "tickets", "example"],
        ["EJEMPLO2000", "10", "2000", "2", "yes"],
        ["DOS", "N", "2000", "2", ""],
      ],
      new Map(),
      { kind: "amount", currency: "CLP" },
    );
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { code: "DOS", maxUses: null, kind: "amount", discountAmount: 2000, ticketCount: 2 },
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

  it("exports a percent file with two example rows before the real codes", async () => {
    const base64 = await buildEventDiscountCodesXlsx({
      kind: "percent",
      rows: [{ code: "SAVE10", uses: "N", percent: 10 }],
    });
    const matrix = readDiscountCodeMatrix(base64);
    expect(matrix?.[0]).toEqual(["code", "uses", "percent", "example"]);
    expect(matrix?.[1]?.[0]).toBe("EJEMPLO10");
    expect(matrix?.[1]?.[3]).toBe("yes");
    expect(matrix?.[3]?.[0]).toBe("SAVE10");
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
    expect(selectEventFamilyDiscount(true, { code: "SAVE", kind: "percent", percent: 10 })).toEqual({
      family: true,
      applied: null,
    });
  });

  it("clears the family checkbox when a code is applied", () => {
    const applied = { code: "SAVE", kind: "percent" as const, percent: 10 };
    expect(selectEventDiscountCode(applied)).toEqual({
      family: false,
      applied,
    });
  });

  it("clears only the code", () => {
    expect(clearEventDiscountCode(false)).toEqual({ family: false, applied: null });
  });
});
