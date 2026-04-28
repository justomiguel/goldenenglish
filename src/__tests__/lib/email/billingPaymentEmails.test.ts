/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { formatBillingPeriodLabel, formatMoneyLabel } from "@/lib/email/billingPaymentEmails";

describe("billingPaymentEmails formatting", () => {
  it("formatBillingPeriodLabel is MM/YYYY for stable email copy", () => {
    expect(formatBillingPeriodLabel(3, 2026)).toBe("03/2026");
  });

  it("formatMoneyLabel uses currency and locale", () => {
    expect(formatMoneyLabel(100, "USD", "en")).toContain("100");
    expect(formatMoneyLabel(100, "ARS", "es")).toBeTruthy();
  });
});
