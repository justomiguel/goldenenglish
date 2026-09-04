/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { mapPublicShopOrder } from "@/lib/shop/mapPublicShopOrder";

const row = {
  id: "o1",
  status: "paid",
  currency: "CLP",
  total: 20,
  paid_at: "2026-09-04T12:00:00.000Z",
  ready_at: null,
  picked_up_at: null,
  expired_at: null,
  buyer_email: "secret@example.com",
  shop_order_items: [
    {
      title: "Hoodie",
      size: "M",
      color: "Navy",
      sku: "HOODIE-M-NAVY",
      quantity: 1,
      unit_price: 20,
    },
  ],
};

describe("mapPublicShopOrder", () => {
  it("maps snapshots and status without exposing buyer email", () => {
    const order = mapPublicShopOrder(row);
    expect(order).toEqual({
      id: "o1",
      status: "paid",
      currency: "CLP",
      total: 20,
      paidAt: "2026-09-04T12:00:00.000Z",
      readyAt: null,
      pickedUpAt: null,
      expiredAt: null,
      items: [
        {
          title: "Hoodie",
          size: "M",
          color: "Navy",
          sku: "HOODIE-M-NAVY",
          quantity: 1,
          unitPrice: 20,
        },
      ],
    });
    expect(order && "buyerEmail" in order).toBe(false);
  });

  it("returns null for an unknown status", () => {
    expect(mapPublicShopOrder({ ...row, status: "refunded" })).toBeNull();
  });
});
