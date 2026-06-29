/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockValidateSlot = vi.fn();
const mockLoadCreds = vi.fn();
const mockCreatePreference = vi.fn();
const mockLogInvariant = vi.fn();

vi.mock("@/lib/billing/validateStudentSectionMonthlySlot", () => ({
  validateStudentSectionMonthlySlot: (...a: unknown[]) => mockValidateSlot(...a),
}));
vi.mock("@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain", () => ({
  loadMercadoPagoCredentialsPlain: (...a: unknown[]) => mockLoadCreds(...a),
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

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const SECTION_ID = "22222222-2222-4222-8222-222222222222";

// Deferred creation: start no longer reads/writes a `payments` row.
const mockAdmin = { from: vi.fn() };

const baseInput = {
  supabase: {} as never,
  admin: mockAdmin as never,
  encryptionKey32: Buffer.alloc(32),
  studentId: STUDENT_ID,
  sectionId: SECTION_ID,
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

  it("returns slot error when slot validation fails", async () => {
    mockValidateSlot.mockResolvedValue({ ok: false, reason: "forbidden" });
    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "slot", slotReason: "forbidden" });
  });

  it("returns no_credentials when creds are missing", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue(null);
    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "no_credentials" });
  });

  it("returns currency_unsupported when plan currency does not match billing currency", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "USD" });
    mockLoadCreds.mockResolvedValue({ enabled: true, accessToken: "tok", environment: "production" });
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

  it("returns redirectUrl with a tuition slot reference on success (no row created)", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "production",
    });
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
        externalReference: `tuition:${STUDENT_ID}:${SECTION_ID}:2026:6`,
      }),
    );
    // No `payments` row is touched during start.
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it("encodes the tutor parent id in the slot reference when present", async () => {
    const PARENT_ID = "33333333-3333-4333-8333-333333333333";
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({ enabled: true, accessToken: "tok", environment: "production" });
    mockCreatePreference.mockResolvedValue({
      ok: true,
      preferenceId: "pref-abc",
      redirectUrl: "https://mp.com/checkout/pref-abc",
    });

    await startMercadoPagoMonthlyPaymentCore({ ...baseInput, tutorParentId: PARENT_ID });
    expect(mockCreatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: `tuition:${STUDENT_ID}:${SECTION_ID}:2026:6:${PARENT_ID}`,
      }),
    );
  });

  it("returns mp_error when preference creation fails", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "production",
    });
    mockCreatePreference.mockResolvedValue({ ok: false, error: "timeout" });

    const result = await startMercadoPagoMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "mp_error" });
    expect(mockLogInvariant).toHaveBeenCalled();
  });
});
