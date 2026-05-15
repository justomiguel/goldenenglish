import { describe, expect, it } from "vitest";
import { parseLegalAgeMajority } from "@/lib/brand/parseLegalAgeMajority";

describe("parseLegalAgeMajority", () => {
  it("returns the canonical default (18) when the row is missing", () => {
    expect(parseLegalAgeMajority(null)).toBe(18);
    expect(parseLegalAgeMajority(undefined)).toBe(18);
  });

  it("returns the canonical default when the value shape is wrong", () => {
    expect(parseLegalAgeMajority({})).toBe(18);
    expect(parseLegalAgeMajority({ value: "abc" })).toBe(18);
    expect(parseLegalAgeMajority({ value: null })).toBe(18);
  });

  it("parses numeric values inside the valid range", () => {
    expect(parseLegalAgeMajority({ value: 18 })).toBe(18);
    expect(parseLegalAgeMajority({ value: 21 })).toBe(21);
    expect(parseLegalAgeMajority({ value: 16 })).toBe(16);
  });

  it("parses numeric strings", () => {
    expect(parseLegalAgeMajority({ value: "21" })).toBe(21);
  });

  it("falls back to default when the value is out of range", () => {
    expect(parseLegalAgeMajority({ value: 0 })).toBe(18);
    expect(parseLegalAgeMajority({ value: 200 })).toBe(18);
    expect(parseLegalAgeMajority({ value: -5 })).toBe(18);
  });

  it("honors a custom default when provided", () => {
    expect(parseLegalAgeMajority(null, 21)).toBe(21);
    expect(parseLegalAgeMajority({ value: "garbage" }, 21)).toBe(21);
  });

  it("clamps default if caller passes out-of-range fallback", () => {
    expect(parseLegalAgeMajority(null, 9999)).toBe(18);
  });
});
