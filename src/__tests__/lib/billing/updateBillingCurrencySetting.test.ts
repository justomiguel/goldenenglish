import { describe, it, expect, vi } from "vitest";
import { updateBillingCurrencySetting } from "@/lib/billing/updateBillingCurrencySetting";

// REGRESSION CHECK: updating currency affects all billing displays system-wide.

function buildSupabaseMock(upsertError: boolean = false) {
  const chain = {
    upsert: vi.fn().mockResolvedValue({
      error: upsertError ? { message: "DB error" } : null,
    }),
  };
  return {
    from: vi.fn(() => chain),
  } as never;
}

describe("updateBillingCurrencySetting", () => {
  it("returns ok:true for valid ISO 4217 currency code", async () => {
    const supa = buildSupabaseMock();
    const result = await updateBillingCurrencySetting(supa, "EUR");
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("normalizes lowercase input to uppercase", async () => {
    const supa = buildSupabaseMock();
    const result = await updateBillingCurrencySetting(supa, "ars");
    expect(result.ok).toBe(true);
  });

  it("returns error for invalid currency code (too long)", async () => {
    const supa = buildSupabaseMock();
    const result = await updateBillingCurrencySetting(supa, "EURO");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_currency");
  });

  it("returns error for invalid currency code (too short)", async () => {
    const supa = buildSupabaseMock();
    const result = await updateBillingCurrencySetting(supa, "US");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_currency");
  });

  it("returns error for non-alphabetic currency code", async () => {
    const supa = buildSupabaseMock();
    const result = await updateBillingCurrencySetting(supa, "US1");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_currency");
  });

  it("returns db_error when upsert fails", async () => {
    const supa = buildSupabaseMock(true);
    const result = await updateBillingCurrencySetting(supa, "USD");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("db_error");
  });
});
