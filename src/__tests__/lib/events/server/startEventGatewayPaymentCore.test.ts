import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";

const mocks = vi.hoisted(() => ({
  loadMercadoPagoCredentialsPlain: vi.fn(),
  mercadoPagoCreatePreference: vi.fn(),
  loadFlowChileCredentialsPlain: vi.fn(),
  flowChileApiBase: vi.fn(() => "https://flow.test/api"),
  flowCreatePaymentOrder: vi.fn(),
  getPublicSiteUrl: vi.fn(() => "https://goldenenglish.cl"),
  loadEventAttendeeGatewayContext: vi.fn(),
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
vi.mock("@/lib/events/server/loadEventAttendeeGatewayContext", () => ({
  loadEventAttendeeGatewayContext: mocks.loadEventAttendeeGatewayContext,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerActionInvariantViolation: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { startEventGatewayPaymentCore } from "@/lib/events/server/startEventGatewayPaymentCore";

interface ContextOverrides {
  attendeeStatus?: string;
  amount?: number;
  currency?: string;
  email?: string;
  dni?: string;
  slug?: string;
}

function buildContext(overrides: ContextOverrides = {}) {
  return {
    attendeeId: "att-1",
    eventId: "evt-1",
    attendeeStatus: overrides.attendeeStatus ?? "pending_payment",
    isLocalResident: true,
    email: overrides.email ?? "[email protected]",
    dniOrPassport: overrides.dni ?? "12345678",
    slug: overrides.slug ?? "gala",
    title: "Gala",
    currency: overrides.currency ?? "CLP",
    amount: overrides.amount ?? 15000,
  };
}

const admin = {} as never;

const baseInput = {
  encryptionKey32: Buffer.alloc(32),
  slug: "gala",
  attendeeId: "att-1",
  email: "[email protected]",
  dniOrPassport: "12345678",
  locale: "es",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPublicSiteUrl.mockReturnValue("https://goldenenglish.cl");
  mocks.flowChileApiBase.mockReturnValue("https://flow.test/api");
  mocks.loadEventAttendeeGatewayContext.mockResolvedValue(buildContext());
});

describe("startEventGatewayPaymentCore", () => {
  it("creates a Mercado Pago preference linked to the attendee and never writes a payment row", async () => {
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
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: true, redirectUrl: "https://mp.test/checkout/pref-1" });
    expect(mocks.mercadoPagoCreatePreference).toHaveBeenCalledTimes(1);
    expect(mocks.mercadoPagoCreatePreference).toHaveBeenCalledWith(
      expect.objectContaining({ externalReference: "event_attendee:att-1" }),
    );
  });

  it("creates a Flow order with an attendee-scoped commerceOrder and appends the token", async () => {
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
      admin,
      method: "flow",
    });

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://flow.test/pay?token=tok%20123",
    });
    const callArg = mocks.flowCreatePaymentOrder.mock.calls[0][0] as { commerceOrder: string };
    expect(callArg.commerceOrder.startsWith("event_attendee:att-1:")).toBe(true);
  });

  it("returns payment_not_found when the attendee context is missing", async () => {
    mocks.loadEventAttendeeGatewayContext.mockResolvedValue(null);

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "payment_not_found" });
    expect(mocks.mercadoPagoCreatePreference).not.toHaveBeenCalled();
  });

  it("rejects when the identity does not match the attendee", async () => {
    mocks.loadEventAttendeeGatewayContext.mockResolvedValue(buildContext({ dni: "99999999" }));

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "identity_mismatch" });
    expect(mocks.mercadoPagoCreatePreference).not.toHaveBeenCalled();
  });

  it("rejects when the attendee is not pending payment", async () => {
    mocks.loadEventAttendeeGatewayContext.mockResolvedValue(
      buildContext({ attendeeStatus: "confirmed" }),
    );

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "payment_not_pending" });
  });

  it("rejects when the slug does not match the attendee's event", async () => {
    mocks.loadEventAttendeeGatewayContext.mockResolvedValue(
      buildContext({ slug: "other-event" }),
    );

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "payment_not_found" });
  });

  it("rejects unsupported currencies", async () => {
    mocks.loadEventAttendeeGatewayContext.mockResolvedValue(buildContext({ currency: "USD" }));

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "currency_unsupported" });
  });

  it("rejects when the chosen method does not support the currency (Flow + ARS)", async () => {
    mocks.loadEventAttendeeGatewayContext.mockResolvedValue(buildContext({ currency: "ARS" }));

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "flow",
    });

    expect(result).toEqual({ ok: false, code: "method_unavailable" });
  });

  it("returns gateway_error when the provider fails", async () => {
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "sandbox",
    });
    mocks.mercadoPagoCreatePreference.mockResolvedValue({ ok: false, error: "boom" });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "gateway_error" });
  });

  it("returns method_unavailable when MP credentials are disabled", async () => {
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({ enabled: false });

    const result = await startEventGatewayPaymentCore({
      ...baseInput,
      admin,
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: false, code: "method_unavailable" });
  });
});
