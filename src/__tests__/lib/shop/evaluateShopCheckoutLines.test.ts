/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { evaluateShopCheckoutLines } from "@/lib/shop/evaluateShopCheckoutLines";

const VARIANT_ID = "variant-hoodie-m";

const variantRow = {
  id: VARIANT_ID,
  stock: 5,
  price: 15000,
  active: true,
  size: "M",
  color: "Navy",
  sku: "HOODIE-M-NAVY",
  shop_products: { title: "Hoodie", active: true },
};

describe("evaluateShopCheckoutLines", () => {
  it("rejects two lines of the same variant whose quantities sum over stock", () => {
    const result = evaluateShopCheckoutLines(
      [
        { variantId: VARIANT_ID, quantity: 3 },
        { variantId: VARIANT_ID, quantity: 3 },
      ],
      [variantRow],
    );
    expect(result).toEqual({ ok: false, code: "insufficient_stock" });
  });

  it("accepts two lines of the same variant whose quantities sum to stock", () => {
    const result = evaluateShopCheckoutLines(
      [
        { variantId: VARIANT_ID, quantity: 2 },
        { variantId: VARIANT_ID, quantity: 3 },
      ],
      [variantRow],
    );
    expect(result).toEqual({
      ok: true,
      total: 75000,
      items: [
        expect.objectContaining({
          variant_id: VARIANT_ID,
          quantity: 5,
          unit_price: 15000,
        }),
      ],
    });
  });
});
