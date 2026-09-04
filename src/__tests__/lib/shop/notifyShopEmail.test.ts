/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendBrandedEmail } = vi.hoisted(() => ({
  sendBrandedEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));

import { notifyShopEmail } from "@/lib/shop/notifyShopEmail";

describe("notifyShopEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendBrandedEmail.mockResolvedValue({ ok: true, fromOverride: false });
  });

  it("sends through sendBrandedEmail with the shop key", async () => {
    await notifyShopEmail({
      to: "ada@school.cl",
      key: "shop.guest_account_created",
      locale: "en",
      vars: { password: "x", signInUrl: "https://x/login", orderUrl: "https://x/pedido/t" },
    });
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@school.cl",
        templateKey: "shop.guest_account_created",
        locale: "en",
        vars: expect.objectContaining({ password: "x" }),
      }),
    );
  });

  it("does not throw when sendBrandedEmail fails", async () => {
    sendBrandedEmail.mockResolvedValue({ ok: false, error: "provider_down" });
    await expect(
      notifyShopEmail({ to: "ada@school.cl", key: "shop.order_paid" }),
    ).resolves.toBeUndefined();
  });
});
