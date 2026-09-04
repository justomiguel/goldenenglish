/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parseMerchEnabled } from "@/lib/shop/parseMerchEnabled";

describe("parseMerchEnabled", () => {
  it("defaults false when missing", () => {
    expect(parseMerchEnabled(undefined)).toBe(false);
    expect(parseMerchEnabled(null)).toBe(false);
  });
  it("reads boolean and string", () => {
    expect(parseMerchEnabled(true)).toBe(true);
    expect(parseMerchEnabled("false")).toBe(false);
    expect(parseMerchEnabled("true")).toBe(true);
  });
});
