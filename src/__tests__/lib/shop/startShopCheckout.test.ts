/** @vitest-environment node */
// REGRESSION CHECK: Students cannot pay; stock is live; no order row when neither gateway is on.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";

const mocks = vi.hoisted(() => ({
  loadMerchEnabled: vi.fn(),
  loadBillingCurrencySetting: vi.fn(),
  loadMercadoPagoCredentialsPlain: vi.fn(),
  mercadoPagoCreatePreference: vi.fn(),
  loadFlowChileCredentialsPlain: vi.fn(),
  flowChileApiBase: vi.fn(() => "https://flow.test/api"),
  flowCreatePaymentOrder: vi.fn(),
  getPublicSiteUrl: vi.fn(() => "https://goldenenglish.cl"),
}));

vi.mock("@/lib/shop/loadMerchEnabled", () => ({
  loadMerchEnabled: mocks.loadMerchEnabled,
}));
vi.mock("@/lib/billing/loadBillingCurrencySetting", () => ({
  loadBillingCurrencySetting: mocks.loadBillingCurrencySetting,
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

import { startShopCheckout } from "@/lib/shop/startShopCheckout";

const ORDER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const VARIANT_ID = "variant-hoodie-m";
const PAY_TOKEN = "pay-token-shop-1";
const BUYER_ID = "buyer-parent-1";

const variantRow = {
  id: VARIANT_ID,
  stock: 4,
  price: 15000,
  active: true,
  size: "M",
  color: "Navy",
  sku: "HOODIE-M-NAVY",
  shop_products: { title: "Hoodie", active: true },
};

function mockAdmin(opts: {
  variants?: typeof variantRow[] | null;
  orderId?: string;
  payToken?: string;
} = {}) {
  const insertOrder = vi.fn().mockReturnValue({
    select: () => ({
      single: async () => ({
        data: { id: opts.orderId ?? ORDER_ID, pay_token: opts.payToken ?? PAY_TOKEN },
        error: null,
      }),
    }),
  });
  const insertItems = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn(async (fn: string) => {
    if (fn === "payment_flow_reserve_commerce_ref_merch") {
      return { data: "MERCH-2026-00000001", error: null };
    }
    return { data: null, error: { message: `unexpected ${fn}` } };
  });

  return {
    insertOrder,
    insertItems,
    rpc,
    from: (table: string) => {
      if (table === "shop_product_variants") {
        return {
          select: () => ({
            in: async () => ({ data: opts.variants ?? [variantRow], error: null }),
          }),
        };
      }
      if (table === "shop_orders") {
        return { insert: insertOrder };
      }
      if (table === "shop_order_items") {
        return { insert: insertItems };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const baseInput = {
  encryptionKey32: Buffer.alloc(32),
  buyerId: BUYER_ID,
  buyerEmail: "parent@school.cl",
  locale: "es",
  lines: [{ variantId: VARIANT_ID, quantity: 2 }],
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadMerchEnabled.mockResolvedValue(true);
  mocks.loadBillingCurrencySetting.mockResolvedValue({ currency: "CLP" });
  mocks.getPublicSiteUrl.mockReturnValue("https://goldenenglish.cl");
  mocks.flowChileApiBase.mockReturnValue("https://flow.test/api");
  mocks.loadFlowChileCredentialsPlain.mockResolvedValue({
    enabled: true,
    apiKey: "key",
    secretKey: "secret",
  });
  mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({
    enabled: true,
    accessToken: "tok",
    environment: "sandbox",
  });
  mocks.flowCreatePaymentOrder.mockResolvedValue({
    ok: true,
    url: "https://flow.test/pay",
    token: "tok 123",
  });
  mocks.mercadoPagoCreatePreference.mockResolvedValue({
    ok: true,
    preferenceId: "pref-1",
    redirectUrl: "https://mp.test/checkout/pref-1",
  });
});

describe("startShopCheckout", () => {
  it("returns flag_off when merch is disabled", async () => {
    mocks.loadMerchEnabled.mockResolvedValue(false);
    const admin = mockAdmin();
    const result = await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(result).toEqual({ ok: false, code: "flag_off" });
    expect(admin.insertOrder).not.toHaveBeenCalled();
  });

  it("returns empty_cart when there are no lines", async () => {
    const admin = mockAdmin();
    const result = await startShopCheckout({
      ...baseInput,
      lines: [],
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(result).toEqual({ ok: false, code: "empty_cart" });
    expect(admin.insertOrder).not.toHaveBeenCalled();
  });

  it("returns inactive_variant when the product is off", async () => {
    const admin = mockAdmin({
      variants: [{ ...variantRow, shop_products: { title: "Hoodie", active: false } }],
    });
    const result = await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(result).toEqual({ ok: false, code: "inactive_variant" });
    expect(admin.insertOrder).not.toHaveBeenCalled();
  });

  it("rejects a student buyer without inserting an order", async () => {
    const admin = mockAdmin();
    const result = await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "student",
      gateway: "flow",
    });
    expect(result).toEqual({ ok: false, code: "student_forbidden" });
    expect(admin.insertOrder).not.toHaveBeenCalled();
  });

  it.each(["teacher", "admin", "assistant", "site_contact", ""])(
    "rejects a %s buyer as wrong_role without inserting an order",
    async (buyerRole) => {
      const admin = mockAdmin();
      const result = await startShopCheckout({
        ...baseInput,
        admin: admin as never,
        buyerRole,
        gateway: "flow",
      });
      expect(result).toEqual({ ok: false, code: "wrong_role" });
      expect(admin.insertOrder).not.toHaveBeenCalled();
    },
  );

  it("rejects when live variant stock is below the requested quantity", async () => {
    const admin = mockAdmin({
      variants: [{ ...variantRow, stock: 1 }],
    });
    const result = await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(result).toEqual({ ok: false, code: "insufficient_stock" });
    expect(admin.insertOrder).not.toHaveBeenCalled();
  });

  it("rejects two lines of the same variant whose quantities sum over stock", async () => {
    const admin = mockAdmin({
      variants: [{ ...variantRow, stock: 5 }],
    });
    const result = await startShopCheckout({
      ...baseInput,
      lines: [
        { variantId: VARIANT_ID, quantity: 3 },
        { variantId: VARIANT_ID, quantity: 3 },
      ],
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(result).toEqual({ ok: false, code: "insufficient_stock" });
    expect(admin.insertOrder).not.toHaveBeenCalled();
  });

  it("inserts pending_payment plus item snapshots from current variant rows", async () => {
    const admin = mockAdmin();
    const result = await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://flow.test/pay?token=tok%20123",
      payToken: PAY_TOKEN,
    });
    expect(admin.insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        buyer_id: BUYER_ID,
        status: "pending_payment",
        currency: "CLP",
        total: 30000,
        buyer_email: "parent@school.cl",
        gateway_provider: "flow",
      }),
    );
    expect(admin.insertItems).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: ORDER_ID,
        variant_id: VARIANT_ID,
        quantity: 2,
        unit_price: 15000,
        title: "Hoodie",
        size: "M",
        color: "Navy",
        sku: "HOODIE-M-NAVY",
      }),
    ]);
  });

  it("reserves a merch Flow commerce ref only when paying with Flow", async () => {
    const admin = mockAdmin();
    await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(admin.rpc).toHaveBeenCalledWith("payment_flow_reserve_commerce_ref_merch", {
      p_shop_order_id: ORDER_ID,
    });
    expect(mocks.flowCreatePaymentOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        commerceOrder: "MERCH-2026-00000001",
        urlConfirmation: expect.stringContaining("purpose=merch"),
        urlReturn: expect.stringMatching(new RegExp(`/es/tienda/pedido/.+/${PAY_TOKEN}`)),
      }),
    );

    vi.clearAllMocks();
    mocks.loadMerchEnabled.mockResolvedValue(true);
    mocks.loadBillingCurrencySetting.mockResolvedValue({ currency: "CLP" });
    mocks.getPublicSiteUrl.mockReturnValue("https://goldenenglish.cl");
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

    const mpAdmin = mockAdmin();
    await startShopCheckout({
      ...baseInput,
      admin: mpAdmin as never,
      buyerRole: "parent",
      gateway: "mercadopago",
    });
    expect(mpAdmin.rpc).not.toHaveBeenCalled();
  });

  it("uses shop_order:{id} as the Mercado Pago external reference", async () => {
    const admin = mockAdmin();
    await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "parent",
      gateway: "mercadopago",
    });
    expect(mocks.mercadoPagoCreatePreference).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: `shop_order:${ORDER_ID}`,
        notificationUrl: expect.stringContaining("purpose=merch"),
        backUrls: expect.objectContaining({
          success: expect.stringMatching(new RegExp(`/es/tienda/pedido/.+/${PAY_TOKEN}`)),
        }),
      }),
    );
  });

  it("returns no_gateway without inserting when neither gateway is configured", async () => {
    mocks.loadFlowChileCredentialsPlain.mockResolvedValue({ enabled: false });
    mocks.loadMercadoPagoCredentialsPlain.mockResolvedValue({ enabled: false });
    const admin = mockAdmin();
    const result = await startShopCheckout({
      ...baseInput,
      admin: admin as never,
      buyerRole: "parent",
      gateway: "flow",
    });
    expect(result).toEqual({ ok: false, code: "no_gateway" });
    expect(admin.insertOrder).not.toHaveBeenCalled();
    expect(admin.rpc).not.toHaveBeenCalled();
  });
});
