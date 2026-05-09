import { describe, it, expect, vi, beforeEach } from "vitest";

// REGRESSION CHECK: changing billing currency affects all payment displays system-wide.

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockUpdateBillingCurrencySetting = vi.fn();
vi.mock("@/lib/billing/updateBillingCurrencySetting", () => ({
  updateBillingCurrencySetting: (supa: unknown, currency: string) =>
    mockUpdateBillingCurrencySetting(supa, currency),
}));

const mockRecordSystemAudit = vi.fn();
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (p: unknown) => mockRecordSystemAudit(p),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => mockRevalidatePath(p),
}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { setBillingCurrencyAction } from "@/app/[locale]/dashboard/admin/finance/billingSettingsActions";

describe("setBillingCurrencyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockReturnValue({});
  });

  it("returns unauthorized when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no admin"));

    const result = await setBillingCurrencyAction("en", "USD");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("unauthorized");
  });

  it("returns invalid_currency for invalid code", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);
    mockUpdateBillingCurrencySetting.mockResolvedValue({
      ok: false,
      error: "invalid_currency",
    });

    const result = await setBillingCurrencyAction("en", "INVALID");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_currency");
  });

  it("returns db_error when update fails", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);
    mockUpdateBillingCurrencySetting.mockResolvedValue({
      ok: false,
      error: "db_error",
    });

    const result = await setBillingCurrencyAction("en", "USD");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("db_error");
  });

  it("returns ok:true and records audit on success", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);
    mockUpdateBillingCurrencySetting.mockResolvedValue({ ok: true });

    const result = await setBillingCurrencyAction("en", "ars");

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();

    expect(mockRecordSystemAudit).toHaveBeenCalledWith({
      action: "billing_currency_update",
      resourceType: "site_settings",
      resourceId: "billing_currency",
      payload: { currency: "ARS" },
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/dashboard/admin/finance");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/dashboard/admin/academic");
  });
});
