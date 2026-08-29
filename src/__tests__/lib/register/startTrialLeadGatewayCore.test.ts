/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";

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

import { startTrialLeadGatewayCore } from "@/lib/register/startTrialLeadGatewayCore";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function mockAdmin(opts: { commerceRef?: string; rpcError?: { message: string } } = {}) {
  return {
    rpc: async (fn: string) => {
      if (
        fn === "payment_flow_reserve_commerce_ref_trial" ||
        fn === "payment_flow_reserve_commerce_ref_join"
      ) {
        if (opts.rpcError) return { data: null, error: opts.rpcError };
        return { data: opts.commerceRef ?? "TRL-2026-00000001", error: null };
      }
      return { data: null, error: { message: `unexpected ${fn}` } };
    },
  } as unknown as SupabaseClient;
}

const baseInput = {
  admin: mockAdmin(),
  encryptionKey32: Buffer.alloc(32),
  locale: "es",
  purpose: "trial" as const,
  registrationId: REG_ID,
  amount: 15000,
  currency: "CLP",
  title: "Clase de prueba",
  payerEmail: "ana@example.com",
  returnPath: "/es/clase-prueba/tok",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPublicSiteUrl.mockReturnValue("https://goldenenglish.cl");
  mocks.flowChileApiBase.mockReturnValue("https://flow.test/api");
});

describe("startTrialLeadGatewayCore", () => {
  it("rejects missing amount, email, currency, and public url", async () => {
    await expect(startTrialLeadGatewayCore({ ...baseInput, amount: 0 })).resolves.toEqual({
      ok: false,
      code: "no_amount",
    });
    await expect(startTrialLeadGatewayCore({ ...baseInput, payerEmail: "" })).resolves.toEqual({
      ok: false,
      code: "no_payer_email",
    });
    await expect(startTrialLeadGatewayCore({ ...baseInput, currency: "XXX" })).resolves.toEqual({
      ok: false,
      code: "currency_unsupported",
    });
    mocks.getPublicSiteUrl.mockReturnValue(null);
    await expect(startTrialLeadGatewayCore({ ...baseInput, method: "flow" })).resolves.toEqual({
      ok: false,
      code: "no_public_url",
    });
    await expect(
      startTrialLeadGatewayCore({ ...baseInput, method: "flow", currency: "ARS" }),
    ).resolves.toEqual({ ok: false, code: "method_unavailable" });
  });

  it("creates a Mercado Pago preference with trial:<registrationId>", async () => {
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

    const result = await startTrialLeadGatewayCore({ ...baseInput, method: "mercadopago" });

    expect(result).toEqual({ ok: true, redirectUrl: "https://mp.test/checkout/pref-1" });
    expect(mocks.mercadoPagoCreatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: `trial:${REG_ID}`,
        payerEmail: "ana@example.com",
        notificationUrl: expect.stringContaining("purpose=trial"),
      }),
    );
  });

  it("uses join:<registrationId> for convert checkout", async () => {
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "sandbox",
    });
    mocks.mercadoPagoCreatePreference.mockResolvedValue({
      ok: true,
      preferenceId: "pref-2",
      redirectUrl: "https://mp.test/checkout/pref-2",
    });

    const result = await startTrialLeadGatewayCore({
      ...baseInput,
      method: "mercadopago",
      purpose: "join",
    });

    expect(result).toEqual({ ok: true, redirectUrl: "https://mp.test/checkout/pref-2" });
    expect(mocks.mercadoPagoCreatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: `join:${REG_ID}`,
        notificationUrl: expect.stringContaining("purpose=join"),
      }),
    );
  });

  it("returns method_unavailable when Mercado Pago is disabled", async () => {
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({ enabled: false });
    await expect(startTrialLeadGatewayCore({ ...baseInput, method: "mercadopago" })).resolves.toEqual({
      ok: false,
      code: "method_unavailable",
    });
  });

  it("returns gateway_error when Mercado Pago create fails", async () => {
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({
      enabled: true,
      accessToken: "tok",
      environment: "sandbox",
    });
    mocks.mercadoPagoCreatePreference.mockResolvedValue({ ok: false, error: "mp_down" });
    await expect(startTrialLeadGatewayCore({ ...baseInput, method: "mercadopago" })).resolves.toEqual({
      ok: false,
      code: "gateway_error",
    });
  });

  it("creates a Flow order with a reserved trial commerce ref", async () => {
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

    const result = await startTrialLeadGatewayCore({
      ...baseInput,
      admin: mockAdmin({ commerceRef: "TRL-2026-00000042" }),
      method: "flow",
    });

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://flow.test/pay?token=tok%20123",
    });
    expect(mocks.flowCreatePaymentOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        commerceOrder: "TRL-2026-00000042",
        urlConfirmation: expect.stringContaining("purpose=trial"),
      }),
    );
  });

  it("reserves the join Flow commerce ref", async () => {
    mocks.loadFlowChileCredentialsPlain.mockResolvedValue({
      enabled: true,
      apiKey: "key",
      secretKey: "secret",
    });
    mocks.flowCreatePaymentOrder.mockResolvedValue({
      ok: true,
      url: "https://flow.test/pay",
      token: "join-tok",
    });

    const result = await startTrialLeadGatewayCore({
      ...baseInput,
      admin: mockAdmin({ commerceRef: "JOIN-2026-00000001" }),
      method: "flow",
      purpose: "join",
    });

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://flow.test/pay?token=join-tok",
    });
    expect(mocks.flowCreatePaymentOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        commerceOrder: "JOIN-2026-00000001",
        urlConfirmation: expect.stringContaining("purpose=join"),
      }),
    );
  });

  it("returns method_unavailable when Flow is disabled", async () => {
    mocks.loadFlowChileCredentialsPlain.mockResolvedValue({ enabled: false });
    await expect(startTrialLeadGatewayCore({ ...baseInput, method: "flow" })).resolves.toEqual({
      ok: false,
      code: "method_unavailable",
    });
  });

  it("returns gateway_error when Flow reserve or create fails", async () => {
    mocks.loadFlowChileCredentialsPlain.mockResolvedValue({
      enabled: true,
      apiKey: "key",
      secretKey: "secret",
    });
    await expect(
      startTrialLeadGatewayCore({
        ...baseInput,
        admin: mockAdmin({ rpcError: { message: "rpc_down" } }),
        method: "flow",
      }),
    ).resolves.toEqual({ ok: false, code: "gateway_error" });

    mocks.flowCreatePaymentOrder.mockResolvedValue({ ok: false, error: "flow_down" });
    await expect(startTrialLeadGatewayCore({ ...baseInput, method: "flow" })).resolves.toEqual({
      ok: false,
      code: "gateway_error",
    });
  });
});
