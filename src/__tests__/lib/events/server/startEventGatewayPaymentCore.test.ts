import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";

const mocks = vi.hoisted(() => ({
  loadMercadoPagoCredentialsPlain: vi.fn(),
  mercadoPagoCreatePreference: vi.fn(),
  loadFlowChileCredentialsPlain: vi.fn(),
  flowChileApiBase: vi.fn(() => "https://flow.test/api"),
  flowCreatePaymentOrder: vi.fn(),
  getPublicSiteUrl: vi.fn(() => "https://goldenenglish.cl"),
}));

vi.mock("@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain", () => ({
  loadMercadoPagoCredentialsPlain: mocks.loadMercadoPagoCredentialsPlain,
}));
vi.mock("@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference", () => ({
  mercadoPagoCreatePreference: mocks.mercadoPagoCreatePreference,
}));
vi.mock("@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain", () => ({
  loadFlowChileCredentialsPlain: mocks.loadFlowChileCredentialsPlain,
  flowChileApiBase: mocks.flowChileApiBase,
}));
vi.mock("@/lib/payment-gateways/flow/flowCreatePaymentOrder", () => ({
  flowCreatePaymentOrder: mocks.flowCreatePaymentOrder,
}));
vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: mocks.getPublicSiteUrl,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerActionInvariantViolation: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { startEventGatewayPaymentCore } from "@/lib/events/server/startEventGatewayPaymentCore";

interface PaymentRowOverrides {
  status?: string;
  amount?: number;
  currency?: string;
  email?: string;
  dni?: string;
  slug?: string;
}

function buildAdmin(overrides: PaymentRowOverrides = {}) {
  const updateEq2 = vi.fn(async () => ({ error: null }));
  const updateEq1 = vi.fn(() => ({ eq: updateEq2 }));
  const update = vi.fn(() => ({ eq: updateEq1 }));

  const row = {
    id: "pay-1",
    status: overrides.status ?? "pending",
    amount: overrides.amount ?? 15000,
    currency: overrides.currency ?? "CLP",
    event_attendees: {
      email: overrides.email ?? "[email protected]",
      dni_or_passport: overrides.dni ?? "12345678",
      event_id: "evt-1",
      events: { slug: overrides.slug ?? "gala", title: "Gala" },
    },
  };

  const admin = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: row, error: null })),
        })),
      })),
      update,
    })),
  };

  return { admin, update, updateEq1, updateEq2 };
}

const baseInput = {
  encryptionKey32: Buffer.alloc(32),
  slug: "gala",
  paymentId: "pay-1",
  email: "[email protected]",
  dniOrPassport: "12345678",
  locale: "es",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPublicSiteUrl.mockReturnValue("https://goldenenglish.cl");
  mocks.flowChileApiBase.mockReturnValue("https://flow.test/api");
});

describe("startEventGatewayPaymentCore", () => {
  it("creates a Mercado Pago preference and returns the redirect URL", async () => {
    const { admin, update } = buildAdmin();
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "sandbox",
    });
    mocks.mercadoPagoCreatePreference.mockResolvedValue({
      ok: true,
      preferenceId: "pref-1",
      redirectUrl: "https://mp.test/checkout/pref-1",
    });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: true, redirectUrl: "https://mp.test/checkout/pref-1" });
    expect(mocks.mercadoPagoCreatePreference).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      mp_preference_id: "pref-1",
      gateway_provider: "mercadopago",
    });
  });

  it("creates a Flow order and appends the token to the redirect URL", async () => {
    const { admin, update } = buildAdmin();
    mocks.loadFlowChileCredentialsPlain.mockResolvedValue({
      enabled: true,
      apiKey: "key",
      secretKey: "secret",
    });
    mocks.flowCreatePaymentOrder.mockResolvedValue({
      ok: true,
      url: "https://flow.test/pay",
      token: "tok 123",
    });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "flow",
    });

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://flow.test/pay?token=tok%20123",
    });
    expect(update).toHaveBeenCalledWith({ gateway_provider: "flow" });
  });

  it("rejects when the identity does not match the attendee", async () => {
    const { admin } = buildAdmin({ dni: "99999999" });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "identity_mismatch" });
    expect(mocks.mercadoPagoCreatePreference).not.toHaveBeenCalled();
  });

  it("rejects when the payment is not pending", async () => {
    const { admin } = buildAdmin({ status: "approved" });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "payment_not_pending" });
  });

  it("rejects when the slug does not match the payment's event", async () => {
    const { admin } = buildAdmin({ slug: "other-event" });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "payment_not_found" });
  });

  it("rejects unsupported currencies", async () => {
    const { admin } = buildAdmin({ currency: "USD" });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "currency_unsupported" });
  });

  it("rejects when the chosen method does not support the currency (Flow + ARS)", async () => {
    const { admin } = buildAdmin({ currency: "ARS" });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "flow",
    });

    expect(result).toEqual({ ok: false, code: "method_unavailable" });
  });

  it("returns gateway_error when the provider fails", async () => {
    const { admin, update } = buildAdmin();
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "sandbox",
    });
    mocks.mercadoPagoCreatePreference.mockResolvedValue({ ok: false, error: "boom" });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "gateway_error" });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns method_unavailable when MP credentials are disabled", async () => {
    const { admin } = buildAdmin();
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({ enabled: false });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin: admin as never,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "method_unavailable" });
  });
});
