import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateAdminClient = vi.fn();
const mockLoadEncryptionKey = vi.fn();
const mockLoadMpCreds = vi.fn();
const mockLoadFlowCreds = vi.fn();
const mockFlowApiBase = vi.fn();
const mockGatewayCountry = vi.fn();
const mockFinalizeMp = vi.fn();
const mockFinalizeFlow = vi.fn();
const mockLoadAttendeeContext = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: () => mockLoadEncryptionKey(),
}));

vi.mock("@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain", () => ({
  loadMercadoPagoCredentialsPlain: (...args: unknown[]) => mockLoadMpCreds(...args),
}));

vi.mock("@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain", () => ({
  loadFlowChileCredentialsPlain: (...args: unknown[]) => mockLoadFlowCreds(...args),
  flowChileApiBase: (...args: unknown[]) => mockFlowApiBase(...args),
}));

vi.mock("@/lib/payment-gateways/gatewayCountryForBillingCurrency", () => ({
  gatewayCountryForBillingCurrency: (...args: unknown[]) => mockGatewayCountry(...args),
}));

vi.mock("@/lib/events/server/finalizeEventPaymentFromMercadoPago", () => ({
  finalizeEventPaymentFromMercadoPago: (...args: unknown[]) => mockFinalizeMp(...args),
}));

vi.mock("@/lib/events/server/finalizeEventPaymentFromFlowGateway", () => ({
  finalizeEventPaymentFromFlowGateway: (...args: unknown[]) => mockFinalizeFlow(...args),
}));

vi.mock("@/lib/events/server/loadEventAttendeeGatewayContext", () => ({
  loadEventAttendeeGatewayContext: (...args: unknown[]) => mockLoadAttendeeContext(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logServerWarn: vi.fn(),
}));

import {
  reconcileEventFlowReturn,
  reconcileEventMercadoPagoReturn,
} from "@/lib/events/server/reconcileEventGatewayPaymentReturn";

describe("reconcileEventMercadoPagoReturn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadEncryptionKey.mockReturnValue("encryption-key-32-bytes-long!!!!");
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { currency: "ARS" }, error: null })),
          })),
        })),
      })),
    });
    mockGatewayCountry.mockReturnValue("AR");
    mockLoadMpCreds.mockResolvedValue({ enabled: true, accessToken: "mp-token" });
    mockFinalizeMp.mockResolvedValue({ ok: true, paymentId: "pay-1" });
  });

  it("returns failure when Mercado Pago reports a failed checkout", async () => {
    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "failure",
    });

    expect(result).toBe("failure");
    expect(mockFinalizeMp).not.toHaveBeenCalled();
  });

  it("returns failure when Mercado Pago reports rejected checkout", async () => {
    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "rejected",
    });

    expect(result).toBe("failure");
    expect(mockFinalizeMp).not.toHaveBeenCalled();
  });

  it("returns processing when payment id is missing", async () => {
    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });

    expect(result).toBe("processing");
  });

  it("returns processing when encryption key is unavailable", async () => {
    mockLoadEncryptionKey.mockImplementation(() => {
      throw new Error("missing key");
    });

    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });

    expect(result).toBe("processing");
  });

  it("returns processing when gateway country cannot be resolved", async () => {
    mockGatewayCountry.mockReturnValue(null);

    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });

    expect(result).toBe("processing");
  });

  it("returns pending when Mercado Pago payment is not approved yet", async () => {
    mockFinalizeMp.mockResolvedValue({ ok: true, skipped: "mp_not_approved" });

    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });

    expect(result).toBe("pending");
  });

  it("returns success when payment finalization succeeds", async () => {
    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });

    expect(result).toBe("success");
    expect(mockFinalizeMp).toHaveBeenCalledWith(
      expect.objectContaining({ mpPaymentId: "123", accessToken: "mp-token" }),
    );
  });

  it("resolves currency from the attendee context for deferred-creation references", async () => {
    mockLoadAttendeeContext.mockResolvedValue({ currency: "ARS" });

    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_attendee:att-1",
      returnStatus: "approved",
    });

    expect(result).toBe("success");
    expect(mockLoadAttendeeContext).toHaveBeenCalledWith(expect.anything(), "att-1");
    expect(mockGatewayCountry).toHaveBeenCalledWith("ARS");
  });

  it("returns processing when Mercado Pago credentials are disabled", async () => {
    mockLoadMpCreds.mockResolvedValue({ enabled: false });

    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });

    expect(result).toBe("processing");
  });

  it("returns processing when finalization fails", async () => {
    mockFinalizeMp.mockResolvedValue({ ok: false });

    const result = await reconcileEventMercadoPagoReturn({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });

    expect(result).toBe("processing");
  });
});

describe("reconcileEventFlowReturn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadEncryptionKey.mockReturnValue("encryption-key-32-bytes-long!!!!");
    mockCreateAdminClient.mockReturnValue({});
    mockLoadFlowCreds.mockResolvedValue({
      enabled: true,
      apiKey: "flow-key",
      secretKey: "flow-secret",
    });
    mockFlowApiBase.mockReturnValue("https://flow.test");
    mockFinalizeFlow.mockResolvedValue({ ok: true, paymentId: "pay-flow" });
  });

  it("returns processing when token is empty", async () => {
    expect(await reconcileEventFlowReturn({ token: "  " })).toBe("processing");
  });

  it("returns pending when Flow payment is not paid yet", async () => {
    mockFinalizeFlow.mockResolvedValue({ ok: true, skipped: "flow_not_paid" });

    expect(await reconcileEventFlowReturn({ token: "flow-token" })).toBe("pending");
  });

  it("returns success when Flow finalization succeeds", async () => {
    expect(await reconcileEventFlowReturn({ token: "flow-token" })).toBe("success");
    expect(mockFinalizeFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "flow-token",
        apiKey: "flow-key",
        secretKey: "flow-secret",
      }),
    );
  });

  it("returns processing when Flow credentials are disabled", async () => {
    mockLoadFlowCreds.mockResolvedValue({ enabled: false });

    expect(await reconcileEventFlowReturn({ token: "flow-token" })).toBe("processing");
  });

  it("returns processing when Flow finalization fails", async () => {
    mockFinalizeFlow.mockResolvedValue({ ok: false });

    expect(await reconcileEventFlowReturn({ token: "flow-token" })).toBe("processing");
  });

  it("returns processing when encryption key is unavailable", async () => {
    mockLoadEncryptionKey.mockImplementation(() => {
      throw new Error("missing key");
    });

    expect(await reconcileEventFlowReturn({ token: "flow-token" })).toBe("processing");
  });
});
