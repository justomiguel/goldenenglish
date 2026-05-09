import { describe, it, expect, vi } from "vitest";
import { loadBillingCurrencySetting, DEFAULT_BILLING_CURRENCY } from "@/lib/billing/loadBillingCurrencySetting";

// REGRESSION CHECK: billing currency is system-wide; changes affect all payment displays.

function buildSupabaseMock(settingValue: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue({
      data: settingValue != null ? { value: settingValue } : null,
      error: null,
    }),
  };
  return {
    from: vi.fn(() => chain),
  } as never;
}

describe("loadBillingCurrencySetting", () => {
  it("returns USD as default when setting does not exist", async () => {
    const supa = buildSupabaseMock(null);
    const result = await loadBillingCurrencySetting(supa);
    expect(result.currency).toBe(DEFAULT_BILLING_CURRENCY);
    expect(result.currency).toBe("USD");
  });

  it("returns configured currency when set", async () => {
    const supa = buildSupabaseMock("ARS");
    const result = await loadBillingCurrencySetting(supa);
    expect(result.currency).toBe("ARS");
  });

  it("normalizes lowercase currency to uppercase", async () => {
    const supa = buildSupabaseMock("eur");
    const result = await loadBillingCurrencySetting(supa);
    expect(result.currency).toBe("EUR");
  });

  it("falls back to USD for invalid currency code", async () => {
    const supa = buildSupabaseMock("INVALID");
    const result = await loadBillingCurrencySetting(supa);
    expect(result.currency).toBe("USD");
  });

  it("falls back to USD for non-string value", async () => {
    const supa = buildSupabaseMock(123);
    const result = await loadBillingCurrencySetting(supa);
    expect(result.currency).toBe("USD");
  });
});
