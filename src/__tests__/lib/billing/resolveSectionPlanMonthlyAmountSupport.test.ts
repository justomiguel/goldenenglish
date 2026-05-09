import { describe, expect, it } from "vitest";
import { parseUtcDate } from "@/lib/billing/resolveSectionPlanMonthlyAmountSupport";

describe("resolveSectionPlanMonthlyAmountSupport", () => {
  describe("parseUtcDate", () => {
    it("parses yyyy-mm-dd iso date at UTC noon", () => {
      const d = parseUtcDate("2026-03-09");
      expect(d).not.toBeNull();
      expect(d!.getUTCFullYear()).toBe(2026);
      expect(d!.getUTCMonth()).toBe(2);
      expect(d!.getUTCDate()).toBe(9);
    });

    it("returns null for empty or invalid fragments", () => {
      expect(parseUtcDate(undefined)).toBeNull();
      expect(parseUtcDate("")).toBeNull();
      expect(parseUtcDate("not-a-date")).toBeNull();
    });
  });
});
