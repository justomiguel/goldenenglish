/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { notifyShopEmail } from "@/lib/shop/notifyShopEmail";

describe("notifyShopEmail", () => {
  it("is a no-op until Task 8 wires branded mail", async () => {
    await expect(
      notifyShopEmail({
        to: "ada@school.cl",
        key: "shop.guest_account_created",
        vars: { password: "x" },
      }),
    ).resolves.toBeUndefined();
  });
});
