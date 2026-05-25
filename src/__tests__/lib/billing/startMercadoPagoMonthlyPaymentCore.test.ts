/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockResolveSlot = vi.fn();
const mockLoadCreds = vi.fn();
const mockResolvePlan = vi.fn();
const mockCreatePreference = vi.fn();
const mockLogInvariant = vi.fn();

vi.mock("@/lib/billing/resolveStudentPaymentSlot", () => ({
  resolveStudentPaymentSlot: (...a: unknown[]) => mockResolveSlot(...a),
}));
vi.mock("@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain", () => ({
  loadMercadoPagoCredentialsPlain: (...a: unknown[]) => mockLoadCreds(...a),
}));
vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  resolveSectionPlanMonthlyAmount: (...a: unknown[]) => mockResolvePlan(...a),
}));
vi.mock("@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference", () => ({
  mercadoPagoCreatePreference: (...a: unknown[]) => mockCreatePreference(...a),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerActionInvariantViolation: (...a: unknown[]) => mockLogInvariant(...a),
}));
vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => new URL("https://test.example.com"),
}));

import { startMercadoPagoMonthlyPaymentCore } from "@/lib/billing/startMercadoPagoMonthlyPaymentCore";
import { Buffer } from "node:buffer";

const mockAdmin = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({ in: vi.fn(() => ({ error: null })) })),
        error: null,
      })),
    })),
  })),
};

const baseInput = {
  supabase: {} as never,
  admin: mockAdmin as never,
  encryptionKey32: Buffer.alloc(32),
  studentId: "student-1",
  sectionId: "section-1",
  month: 6,
  year: 2026,
  fallbackAmount: 50000,
  payerEmail: "payer@test.com",
  locale: "es",
  title: "Cuota Junio 2026",
  paymentsDashboard: "student" as const,
  tutorParentId: null,
  billingCurrency: "CLP",
};

describe("startMercadoPagoMonthlyPaymentCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns slot error when slot resolution fails", async () => {
    mockResolveSlot.mockResolvedValue({ ok: false, reason: "already_approved" });
    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "slot", slotReason: "already_approved" });
  });

  it("returns no_credentials when creds are missing", async () => {
    mockResolveSlot.mockResolvedValue({
      ok: true,
      payment: { id: "pay-1" },
      effectiveAmount: 50000,
    });
    mockLoadCreds.mockResolvedValue(null);
    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "no_credentials" });
  });

  it("returns currency_unsupported when currency does not match", async () => {
    mockResolveSlot.mockResolvedValue({
      ok: true,
      payment: { id: "pay-1" },
      effectiveAmount: 50000,
    });
    mockLoadCreds.mockResolvedValue({ enabled: true, accessToken: "tok", environment: "production" });
    mockResolvePlan.mockResolvedValue({ code: "ok", amount: 50000, currency: "USD" });
    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "currency_unsupported" });
  });

  it("returns no_country for unsupported billingCurrency", async () => {
    const result = await startMercadoPagoMonthlyPaymentCore({
      ...baseInput,
      billingCurrency: "EUR",
    });
    expect(result).toEqual({ ok: false, code: "no_country" });
  });

  it("returns redirectUrl and persists preference on success", async () => {
    mockResolveSlot.mockResolvedValue({
      ok: true,
      payment: { id: "pay-1" },
      effectiveAmount: 50000,
    });
    mockLoadCreds.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "production",
    });
    mockResolvePlan.mockResolvedValue({ code: "ok", amount: 50000, currency: "CLP" });
    mockCreatePreference.mockResolvedValue({
      ok: true,
      preferenceId: "pref-abc",
      redirectUrl: "https://mp.com/checkout/pref-abc",
    });

    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: true, redirectUrl: "https://mp.com/checkout/pref-abc" });
    expect(mockCreatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "tok",
        unitPrice: 50000,
        currencyId: "CLP",
        externalReference: "pay-1",
      }),
    );
  });

  it("returns mp_error when preference creation fails", async () => {
    mockResolveSlot.mockResolvedValue({
      ok: true,
      payment: { id: "pay-1" },
      effectiveAmount: 50000,
    });
    mockLoadCreds.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "production",
    });
    mockResolvePlan.mockResolvedValue({ code: "ok", amount: 50000, currency: "CLP" });
    mockCreatePreference.mockResolvedValue({ ok: false, error: "timeout" });

    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "mp_error" });
    expect(mockLogInvariant).toHaveBeenCalled();
  });
});
