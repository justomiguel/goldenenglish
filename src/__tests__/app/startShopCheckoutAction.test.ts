/** @vitest-environment node */
// REGRESSION CHECK: Failed checkout must not provision a guest; only parents may pay.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileMaybeSingle: vi.fn(),
  ensureGuest: vi.fn(),
  start: vi.fn(),
  validate: vi.fn(),
  loadKey: vi.fn(() => Buffer.alloc(32)),
  notify: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.profileMaybeSingle }),
      }),
    }),
  }),
}));
vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: mocks.loadKey,
}));
vi.mock("@/lib/shop/ensureGuestShopperParent", () => ({
  ensureGuestShopperParent: mocks.ensureGuest,
}));
vi.mock("@/lib/shop/startShopCheckout", () => ({
  startShopCheckout: mocks.start,
}));
vi.mock("@/lib/shop/validateShopCheckout", () => ({
  validateShopCheckout: mocks.validate,
}));
vi.mock("@/lib/shop/notifyShopEmail", () => ({
  notifyShopEmail: mocks.notify,
}));
vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => "https://goldenenglish.cl",
}));

import { startShopCheckoutAction } from "@/app/[locale]/tienda/checkout/actions";

const guestInput = {
  locale: "es",
  gateway: "flow" as const,
  email: "ada@school.cl",
  lines: [{ variantId: "variant-hoodie-m", quantity: 1 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  mocks.profileMaybeSingle.mockResolvedValue({ data: null, error: null });
  mocks.validate.mockResolvedValue({
    ok: true,
    currency: "CLP",
    items: [],
    total: 15000,
  });
  mocks.start.mockResolvedValue({
    ok: true,
    redirectUrl: "https://flow.test/pay",
    payToken: "tok",
  });
  mocks.ensureGuest.mockResolvedValue({
    kind: "created",
    profileId: "guest-1",
    tempPassword: "temp-pass-1234",
  });
});

describe("startShopCheckoutAction", () => {
  it("does not create a guest when the cart is empty", async () => {
    mocks.validate.mockResolvedValue({ ok: false, code: "empty_cart" });
    const result = await startShopCheckoutAction({ ...guestInput, lines: [] });
    expect(result).toEqual({ ok: false, code: "empty_cart" });
    expect(mocks.ensureGuest).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("does not create a guest when merch is disabled", async () => {
    mocks.validate.mockResolvedValue({ ok: false, code: "flag_off" });
    const result = await startShopCheckoutAction(guestInput);
    expect(result).toEqual({ ok: false, code: "flag_off" });
    expect(mocks.ensureGuest).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it.each(["teacher", "admin"])(
    "rejects a logged-in %s without starting checkout",
    async (role) => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: `${role}-1`, email: `${role}@school.cl` } },
      });
      mocks.profileMaybeSingle.mockResolvedValue({ data: { role }, error: null });
      const result = await startShopCheckoutAction({
        locale: "es",
        gateway: "flow",
        lines: guestInput.lines,
      });
      expect(result).toEqual({ ok: false, code: "wrong_role" });
      expect(mocks.ensureGuest).not.toHaveBeenCalled();
      expect(mocks.validate).not.toHaveBeenCalled();
      expect(mocks.start).not.toHaveBeenCalled();
    },
  );
});
