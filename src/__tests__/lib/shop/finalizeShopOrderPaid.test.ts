/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  notify: vi.fn(),
  notifyAdmins: vi.fn(),
  warn: vi.fn(),
  flowStatus: vi.fn(),
  mpGet: vi.fn(),
}));

vi.mock("@/lib/shop/notifyShopEmail", () => ({
  notifyShopEmail: (...args: unknown[]) => mocks.notify(...args),
}));
vi.mock("@/lib/email/notifyAdminsPurchasePayment", () => ({
  notifyAdminsPaymentPaid: (...args: unknown[]) => mocks.notifyAdmins(...args),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerWarn: (...args: unknown[]) => mocks.warn(...args),
}));
vi.mock("@/lib/payment-gateways/flow/flowFetchPaymentStatus", () => ({
  flowFetchPaymentStatus: (...args: unknown[]) => mocks.flowStatus(...args),
}));
vi.mock("@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment", () => ({
  mercadoPagoGetPayment: (...args: unknown[]) => mocks.mpGet(...args),
}));

import { markShopOrderPaid } from "@/lib/shop/markShopOrderPaid";
import { finalizeShopOrderFromFlowGateway } from "@/lib/shop/finalizeShopOrderFromFlowGateway";
import { finalizeShopOrderFromMercadoPago } from "@/lib/shop/finalizeShopOrderFromMercadoPago";
import { parseShopOrderGatewayReference } from "@/lib/shop/buildShopOrderGatewayReference";

const ORDER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("markShopOrderPaid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("second finalize is a no-op", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "already_paid", error: null });
    const r = await markShopOrderPaid({ admin: { rpc }, orderId: "o" });
    expect(r).toEqual({ ok: true, alreadyPaid: true });
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.notifyAdmins).not.toHaveBeenCalled();
  });

  it("returns false when the RPC errors or data is unexpected", async () => {
    const rpcError = vi.fn().mockResolvedValue({ data: null, error: { message: "rpc" } });
    expect(await markShopOrderPaid({ admin: { rpc: rpcError }, orderId: "o" })).toEqual({
      ok: false,
    });
    const rpcOdd = vi.fn().mockResolvedValue({ data: "nope", error: null });
    expect(await markShopOrderPaid({ admin: { rpc: rpcOdd }, orderId: "o" })).toEqual({ ok: false });
  });

  it("insufficient stock does not throw as success", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "insufficient_stock", error: null });
    const r = await markShopOrderPaid({ admin: { rpc }, orderId: "o" });
    expect(r).toEqual({ ok: false, code: "insufficient_stock" });
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.notifyAdmins).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalled();
  });

  it("paid decrements once and sends shop.order_paid", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "paid", error: null });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { buyer_email: "ada@school.cl", pay_token: "tok-1", total: 12000, currency: "CLP" },
      error: null,
    });
    const admin = {
      rpc,
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      })),
    };
    const r = await markShopOrderPaid({ admin, orderId: "o" });
    expect(r).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("shop_mark_paid_and_decrement_stock", { p_order_id: "o" });
    expect(mocks.notifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "shop",
        payerName: "ada@school.cl",
        amount: 12000,
        currency: "CLP",
      }),
    );
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@school.cl",
        key: "shop.order_paid",
        locale: "es",
        vars: expect.objectContaining({
          orderUrl: expect.stringContaining("/es/tienda/pedido/pedido/tok-1"),
          pickupNote: "Retiro en el instituto en horario de atención.",
        }),
      }),
    );
    const sent = mocks.notify.mock.calls[0]?.[0] as { vars?: Record<string, string> };
    expect(sent.vars?.orderUrl).not.toContain("{{orderUrl}}");
    expect(sent.vars?.pickupNote).not.toContain("{{pickupNote}}");
  });
});

function shopAdmin(opts: { shopOrderId?: string | null; rpcData?: string } = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: opts.rpcData ?? "paid", error: null });
  const admin = {
    rpc,
    from: (table: string) => {
      if (table === "payment_flow_checkout_refs") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.shopOrderId ? { shop_order_id: opts.shopOrderId } : null,
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { buyer_email: "ada@school.cl" },
              error: null,
            }),
          }),
        }),
      };
    },
  };
  return { admin: admin as unknown as SupabaseClient, rpc };
}

describe("finalizeShopOrderFromFlowGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails when Flow status cannot be fetched", async () => {
    mocks.flowStatus.mockResolvedValue({ ok: false });
    const { admin, rpc } = shopAdmin({ shopOrderId: ORDER_ID });
    const result = await finalizeShopOrderFromFlowGateway({
      admin,
      apiBaseUrl: "https://flow.test",
      apiKey: "k",
      secretKey: "s",
      token: "tok",
    });
    expect(result).toEqual({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("skips when the commerce ref has no shop order", async () => {
    mocks.flowStatus.mockResolvedValue({
      ok: true,
      data: { status: 2, commerceOrder: "MERCH-2026-00000001" },
    });
    const { admin, rpc } = shopAdmin({ shopOrderId: null });
    const result = await finalizeShopOrderFromFlowGateway({
      admin,
      apiBaseUrl: "https://flow.test",
      apiKey: "k",
      secretKey: "s",
      token: "tok",
    });
    expect(result).toEqual({ ok: true, skipped: "not_found" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("skips when Flow has not captured the payment", async () => {
    mocks.flowStatus.mockResolvedValue({
      ok: true,
      data: { status: 1, commerceOrder: "MERCH-2026-00000001" },
    });
    const { admin, rpc } = shopAdmin({ shopOrderId: ORDER_ID });
    const result = await finalizeShopOrderFromFlowGateway({
      admin,
      apiBaseUrl: "https://flow.test",
      apiKey: "k",
      secretKey: "s",
      token: "tok",
    });
    expect(result).toEqual({ ok: true, skipped: "flow_not_paid" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("resolves MERCH- ref and marks the order paid", async () => {
    mocks.flowStatus.mockResolvedValue({
      ok: true,
      data: { status: 2, commerceOrder: "MERCH-2026-00000001" },
    });
    const { admin, rpc } = shopAdmin({ shopOrderId: ORDER_ID, rpcData: "paid" });
    const result = await finalizeShopOrderFromFlowGateway({
      admin,
      apiBaseUrl: "https://flow.test",
      apiKey: "k",
      secretKey: "s",
      token: "tok",
    });
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("shop_mark_paid_and_decrement_stock", {
      p_order_id: ORDER_ID,
    });
  });
});

describe("finalizeShopOrderFromMercadoPago", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails when Mercado Pago cannot be fetched", async () => {
    mocks.mpGet.mockResolvedValue({ ok: false });
    const { admin, rpc } = shopAdmin();
    const result = await finalizeShopOrderFromMercadoPago({
      admin,
      accessToken: "tok",
      mpPaymentId: "1",
    });
    expect(result).toEqual({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("skips when the external reference is not a shop order", async () => {
    mocks.mpGet.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: "enrollment:nope" },
    });
    const { admin, rpc } = shopAdmin();
    const result = await finalizeShopOrderFromMercadoPago({
      admin,
      accessToken: "tok",
      mpPaymentId: "1",
    });
    expect(result).toEqual({ ok: true, skipped: "not_found" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("skips when Mercado Pago has not approved the payment", async () => {
    mocks.mpGet.mockResolvedValue({
      ok: true,
      data: { status: "pending", external_reference: `shop_order:${ORDER_ID}` },
    });
    const { admin, rpc } = shopAdmin();
    const result = await finalizeShopOrderFromMercadoPago({
      admin,
      accessToken: "tok",
      mpPaymentId: "1",
    });
    expect(result).toEqual({ ok: true, skipped: "mp_not_approved" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("marks paid from shop_order:<uuid>", async () => {
    mocks.mpGet.mockResolvedValue({
      ok: true,
      data: { status: "approved", external_reference: `shop_order:${ORDER_ID}` },
    });
    const { admin, rpc } = shopAdmin({ rpcData: "paid" });
    const result = await finalizeShopOrderFromMercadoPago({
      admin,
      accessToken: "tok",
      mpPaymentId: "1",
    });
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("shop_mark_paid_and_decrement_stock", {
      p_order_id: ORDER_ID,
    });
  });
});

describe("parseShopOrderGatewayReference", () => {
  it("reads shop_order:<uuid>", () => {
    expect(parseShopOrderGatewayReference(`shop_order:${ORDER_ID}`)).toBe(ORDER_ID);
  });

  it("rejects other prefixes", () => {
    expect(parseShopOrderGatewayReference(`enrollment:${ORDER_ID}`)).toBeNull();
  });
});
