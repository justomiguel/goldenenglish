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

import { startRegistrationEnrollmentGatewayCore } from "@/lib/register/startRegistrationEnrollmentGatewayCore";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TOKEN = "pay-token-1";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "new",
    intake_state: "awaiting_fee",
    fee_captured: false,
    fee_snapshot: { total: 15000, currency: "CLP" },
    preferred_section_id: "sec-1",
    additional_section_ids: [],
    is_minor: false,
    student_email: "ana@example.com",
    tutor_email: null,
    first_name: "Ana",
    last_name: "Pérez",
    ...overrides,
  };
}

function mockAdmin(opts: {
  row?: Record<string, unknown> | null;
  seatOpen?: boolean;
  commerceRef?: string;
} = {}) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: opts.row === undefined ? lead() : opts.row, error: null }),
        }),
      }),
    }),
    rpc: async (fn: string) => {
      if (fn === "registration_public_section_has_open_seat") {
        return { data: opts.seatOpen !== false, error: null };
      }
      if (fn === "payment_flow_reserve_commerce_ref_enrollment") {
        return { data: opts.commerceRef ?? "MAT-2026-00000001", error: null };
      }
      return { data: null, error: { message: `unexpected ${fn}` } };
    },
  } as unknown as SupabaseClient;
}

const baseInput = {
  encryptionKey32: Buffer.alloc(32),
  payToken: TOKEN,
  locale: "es",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPublicSiteUrl.mockReturnValue("https://goldenenglish.cl");
  mocks.flowChileApiBase.mockReturnValue("https://flow.test/api");
});

describe("startRegistrationEnrollmentGatewayCore", () => {
  it("creates a Mercado Pago preference with enrollment:<registrationId>", async () => {
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

    const result = await startRegistrationEnrollmentGatewayCore({
      ...baseInput,
      admin: mockAdmin(),
      method: "mercadopago",
    });

    expect(result).toEqual({ ok: true, redirectUrl: "https://mp.test/checkout/pref-1" });
    expect(mocks.mercadoPagoCreatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: `enrollment:${REG_ID}`,
        payerEmail: "ana@example.com",
        notificationUrl: expect.stringContaining("purpose=enrollment"),
      }),
    );
  });

  it("creates a Flow order with a reserved MAT- commerce ref", async () => {
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

    const result = await startRegistrationEnrollmentGatewayCore({
      ...baseInput,
      admin: mockAdmin({ commerceRef: "MAT-2026-00000042" }),
      method: "flow",
    });

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://flow.test/pay?token=tok%20123",
    });
    expect(mocks.flowCreatePaymentOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        commerceOrder: "MAT-2026-00000042",
        urlConfirmation: expect.stringContaining("purpose=enrollment"),
      }),
    );
  });

  it("returns section_full when the seat vanished", async () => {
    const result = await startRegistrationEnrollmentGatewayCore({
      ...baseInput,
      admin: mockAdmin({ seatOpen: false }),
      method: "mercadopago",
    });
    expect(result).toEqual({ ok: false, code: "section_full" });
    expect(mocks.mercadoPagoCreatePreference).not.toHaveBeenCalled();
  });

  it("does not start a second charge after capture", async () => {
    const result = await startRegistrationEnrollmentGatewayCore({
      ...baseInput,
      admin: mockAdmin({ row: lead({ fee_captured: true }) }),
      method: "mercadopago",
    });
    expect(result).toEqual({ ok: false, code: "already_captured" });
  });

  it("returns not_found for an unknown token", async () => {
    const result = await startRegistrationEnrollmentGatewayCore({
      ...baseInput,
      admin: mockAdmin({ row: null }),
      method: "flow",
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });
});
