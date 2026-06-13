/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockLoadKey = vi.fn();
const mockAdminClient = vi.fn();
const mockLoadCreds = vi.fn();
const mockGetPayment = vi.fn();
const mockFinalize = vi.fn();
const mockLogWarn = vi.fn();

vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: () => mockLoadKey(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient(),
}));
vi.mock("@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain", () => ({
  loadMercadoPagoCredentialsPlain: (...a: unknown[]) => mockLoadCreds(...a),
}));
vi.mock("@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment", () => ({
  mercadoPagoGetPayment: (...a: unknown[]) => mockGetPayment(...a),
}));
vi.mock("@/lib/billing/finalizeMercadoPagoPayment", () => ({
  finalizeMercadoPagoPayment: (...a: unknown[]) => mockFinalize(...a),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: (...a: unknown[]) => mockLogWarn(...a),
}));

import { resolveMercadoPagoMonthlyPaymentReturnPage } from "@/lib/billing/resolveMercadoPagoMonthlyPaymentReturnPage";
import { Buffer } from "node:buffer";

function makeSupa(selectResult: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: selectResult, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { from: vi.fn(() => ({ select })), _maybeSingle: maybeSingle };
}

describe("resolveMercadoPagoMonthlyPaymentReturnPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadKey.mockReturnValue(Buffer.alloc(32));
    mockAdminClient.mockReturnValue({});
    mockLoadCreds.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      webhookSecret: "ws",
    });
  });

  it("returns no_reference when no externalReference or mpPaymentId", async () => {
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: undefined,
      mpPaymentId: undefined,
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "no_reference" });
  });

  it("returns misconfigured when country is invalid", async () => {
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "XX",
    });
    expect(result).toEqual({ outcome: "misconfigured" });
  });

  it("returns misconfigured when encryption key throws", async () => {
    mockLoadKey.mockImplementation(() => {
      throw new Error("missing");
    });
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "misconfigured" });
  });

  it("returns not_paid when returnStatus is failure", async () => {
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "failure",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "not_paid" });
  });

  it("returns processing when no mpId", async () => {
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: undefined,
      returnStatus: "pending",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "processing" });
  });

  it("returns reconcile_error when getPayment fails", async () => {
    mockGetPayment.mockResolvedValue({ ok: false, error: "network" });
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "reconcile_error" });
  });

  it("returns success when payment already approved in DB", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: "pay-1" },
    });
    const supa = makeSupa({ id: "pay-1", month: 6, year: 2026, status: "approved" });
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({
      outcome: "success",
      month: 6,
      year: 2026,
      paymentId: "pay-1",
    });
  });

  it("returns unauthorized_payment when RLS hides the payment", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: "pay-1" },
    });
    const supa = makeSupa(null);
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "unauthorized_payment" });
  });

  it("returns processing for mp status pending/in_process", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "pending", external_reference: "pay-1" },
    });
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "processing" });
  });

  it("does not finalize during display-only resolve when payment is still pending", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: "pay-1", transaction_amount: 100, currency_id: "CLP" },
    });
    const supa = makeSupa({ id: "pay-1", month: 6, year: 2026, status: "pending" });
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "processing" });
    expect(mockFinalize).not.toHaveBeenCalled();
  });

  it("finalizes when allowFinalize is true and payment is pending", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: "pay-1", transaction_amount: 100, currency_id: "CLP" },
    });
    mockFinalize.mockResolvedValue({ ok: true, approved: true, paymentId: "pay-1" });
    const supa = makeSupa({ id: "pay-1", month: 6, year: 2026, status: "pending" });
    supa._maybeSingle
      .mockResolvedValueOnce({ data: { id: "pay-1", month: 6, year: 2026, status: "pending" }, error: null })
      .mockResolvedValueOnce({ data: { month: 6, year: 2026 }, error: null });
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      allowFinalize: true,
      externalReference: "pay-1",
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(mockFinalize).toHaveBeenCalled();
    expect(result).toEqual({
      outcome: "success",
      month: 6,
      year: 2026,
      paymentId: "pay-1",
    });
  });
});
