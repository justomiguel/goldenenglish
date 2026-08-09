import { describe, it, expect } from "vitest";
import {
  SECTION_BILLING_MODES,
  parseSectionBillingMode,
  sectionIsClassPackBilled,
} from "@/lib/billing/sectionBillingMode";

// REGRESSION CHECK: this parser must stay STRICT. `parseMonthlyFeeChargeMode` returns
// 'prorate_by_classes' for any unknown value, so overloading that enum with a class-pack mode would
// make older code charge a prorated monthly fee in silence. If someone makes this parser fall back to
// a default, a class-pack section becomes billable as a monthly fee and money moves without an error.

describe("parseSectionBillingMode", () => {
  it("accepts both known modes", () => {
    expect(parseSectionBillingMode("section_monthly_fee")).toBe("section_monthly_fee");
    expect(parseSectionBillingMode("class_pack")).toBe("class_pack");
  });

  it("trims surrounding whitespace", () => {
    expect(parseSectionBillingMode("  class_pack  ")).toBe("class_pack");
  });

  it("returns null for unknown values instead of falling back to a default", () => {
    expect(parseSectionBillingMode("prorate_by_classes")).toBeNull();
    expect(parseSectionBillingMode("CLASS_PACK")).toBeNull();
    expect(parseSectionBillingMode("")).toBeNull();
  });

  it("returns null for non-string input", () => {
    expect(parseSectionBillingMode(null)).toBeNull();
    expect(parseSectionBillingMode(undefined)).toBeNull();
    expect(parseSectionBillingMode(3)).toBeNull();
    expect(parseSectionBillingMode({})).toBeNull();
  });

  it("exposes exactly the two supported modes", () => {
    expect([...SECTION_BILLING_MODES]).toEqual(["section_monthly_fee", "class_pack"]);
  });
});

describe("sectionIsClassPackBilled", () => {
  it("is true only for the class-pack mode", () => {
    expect(sectionIsClassPackBilled("class_pack")).toBe(true);
    expect(sectionIsClassPackBilled("section_monthly_fee")).toBe(false);
  });

  it("treats unknown values as NOT class-pack, so no monthly billing is skipped by accident", () => {
    expect(sectionIsClassPackBilled("nonsense")).toBe(false);
    expect(sectionIsClassPackBilled(null)).toBe(false);
    expect(sectionIsClassPackBilled(undefined)).toBe(false);
  });
});
