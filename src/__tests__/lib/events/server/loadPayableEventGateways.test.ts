import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";

const mocks = vi.hoisted(() => ({
  loadKey: vi.fn(),
  loadFlow: vi.fn(),
  loadMp: vi.fn(),
}));

vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: () => mocks.loadKey(),
}));
vi.mock("@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain", () => ({
  loadFlowChileCredentialsPlain: (...args: unknown[]) => mocks.loadFlow(...args),
}));
vi.mock("@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain", () => ({
  loadMercadoPagoCredentialsPlain: (...args: unknown[]) => mocks.loadMp(...args),
}));

import { loadPayableEventGateways } from "@/lib/events/server/loadPayableEventGateways";

const admin = {} as never;

describe("loadPayableEventGateways", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadKey.mockReturnValue(Buffer.alloc(32));
    mocks.loadFlow.mockResolvedValue({ enabled: true });
    mocks.loadMp.mockResolvedValue({ enabled: false });
  });

  it("omits Mercado Pago when credentials are disabled", async () => {
    const gateways = await loadPayableEventGateways(admin, "CLP");

    expect(gateways).toEqual(["flow"]);
    expect(mocks.loadMp).toHaveBeenCalled();
  });

  it("omits Mercado Pago when credentials cannot be read", async () => {
    mocks.loadMp.mockResolvedValue(null);
    mocks.loadFlow.mockResolvedValue({ enabled: false });

    await expect(loadPayableEventGateways(admin, "CLP")).resolves.toEqual([]);
  });

  it("offers Mercado Pago only when the saved credentials are enabled", async () => {
    mocks.loadFlow.mockResolvedValue({ enabled: false });
    mocks.loadMp.mockResolvedValue({ enabled: true });

    await expect(loadPayableEventGateways(admin, "ARS")).resolves.toEqual(["mercadopago"]);
    expect(mocks.loadFlow).not.toHaveBeenCalled();
  });

  it("offers no online gateway when the encryption key is missing", async () => {
    mocks.loadKey.mockImplementation(() => {
      throw new Error("missing");
    });

    await expect(loadPayableEventGateways(admin, "CLP")).resolves.toEqual([]);
    expect(mocks.loadMp).not.toHaveBeenCalled();
  });
});
