import { describe, it, expect } from "vitest";
import { formatParentPaymentsPickerOption } from "@/lib/billing/formatParentPaymentsPickerOption";

const labels = {
  pending: "{name} — {amount} pending",
  settled: "{name} — up to date",
};

describe("formatParentPaymentsPickerOption", () => {
  it("includes formatted amount when subtotal is positive", () => {
    expect(formatParentPaymentsPickerOption("en", "Ana Lopez", 1200, labels)).toBe(
      "Ana Lopez — $1,200 pending",
    );
  });

  it("uses settled copy when subtotal is zero", () => {
    expect(formatParentPaymentsPickerOption("en", "Ana Lopez", 0, labels)).toBe(
      "Ana Lopez — up to date",
    );
  });
});
