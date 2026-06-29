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

/** Legacy reference is a bare `payments.id` (UUID). */
const PAY_UUID = "11111111-1111-4111-8111-111111111111";
/** Deferred-creation reference encodes the tuition slot, not a row id. */
const SLOT_REF = "tuition:22222222-2222-4222-8222-222222222222:33333333-3333-4333-8333-333333333333:2026:6";

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

  it("returns success when payment already approved in DB (legacy ref)", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: PAY_UUID },
    });
    const supa = makeSupa({ id: PAY_UUID, month: 6, year: 2026, status: "approved" });
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: PAY_UUID,
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({
      outcome: "success",
      month: 6,
      year: 2026,
      paymentId: PAY_UUID,
    });
  });

  it("returns unauthorized_payment when RLS hides the legacy payment", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: PAY_UUID },
    });
    const supa = makeSupa(null);
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: PAY_UUID,
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "unauthorized_payment" });
  });

  it("skips the pre-finalize RLS check for slot refs and stays processing when display-only", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: SLOT_REF, transaction_amount: 100, currency_id: "CLP" },
    });
    const supa = makeSupa();
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: SLOT_REF,
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "processing" });
    expect(mockFinalize).not.toHaveBeenCalled();
    // No `.eq("id", ...)` pre-check is issued for slot references.
    expect(supa.from).not.toHaveBeenCalled();
  });

  it("finalizes slot refs via admin and returns success after re-reading the materialized row", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: SLOT_REF, transaction_amount: 100, currency_id: "CLP" },
    });
    mockFinalize.mockResolvedValue({ ok: true, approved: true, paymentId: PAY_UUID });
    const supa = makeSupa({ month: 6, year: 2026 });
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      allowFinalize: true,
      externalReference: SLOT_REF,
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(mockFinalize).toHaveBeenCalled();
    expect(result).toEqual({
      outcome: "success",
      month: 6,
      year: 2026,
      paymentId: PAY_UUID,
    });
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

  it("does not finalize during display-only resolve when legacy payment is still pending", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: PAY_UUID, transaction_amount: 100, currency_id: "CLP" },
    });
    const supa = makeSupa({ id: PAY_UUID, month: 6, year: 2026, status: "pending" });
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      externalReference: PAY_UUID,
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(result).toEqual({ outcome: "processing" });
    expect(mockFinalize).not.toHaveBeenCalled();
  });

  it("finalizes when allowFinalize is true and legacy payment is pending", async () => {
    mockGetPayment.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: PAY_UUID, transaction_amount: 100, currency_id: "CLP" },
    });
    mockFinalize.mockResolvedValue({ ok: true, approved: true, paymentId: PAY_UUID });
    const supa = makeSupa({ id: PAY_UUID, month: 6, year: 2026, status: "pending" });
    supa._maybeSingle
      .mockResolvedValueOnce({ data: { id: PAY_UUID, month: 6, year: 2026, status: "pending" }, error: null })
      .mockResolvedValueOnce({ data: { month: 6, year: 2026 }, error: null });
    const result = await resolveMercadoPagoMonthlyPaymentReturnPage({
      supabase: supa as never,
      allowFinalize: true,
      externalReference: PAY_UUID,
      mpPaymentId: "mp-1",
      returnStatus: "success",
      countryCode: "CL",
    });
    expect(mockFinalize).toHaveBeenCalled();
    expect(result).toEqual({
      outcome: "success",
      month: 6,
      year: 2026,
      paymentId: PAY_UUID,
    });
  });
});
