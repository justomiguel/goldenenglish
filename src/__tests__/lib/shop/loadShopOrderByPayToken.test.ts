/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadShopOrderByPayToken } from "@/lib/shop/loadShopOrderByPayToken";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

function adminClient(data: unknown, error: unknown = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    })),
  };
}

describe("loadShopOrderByPayToken", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
  });

  it("returns null for a blank token", async () => {
    await expect(loadShopOrderByPayToken("  ")).resolves.toBeNull();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("returns null when the token query fails", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      adminClient(null, { message: "down" }) as never,
    );
    await expect(loadShopOrderByPayToken("tok-1")).resolves.toBeNull();
  });

  it("maps a paid order found by token", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      adminClient({
        id: "o1",
        status: "paid",
        currency: "CLP",
        total: 20,
        paid_at: "2026-09-04T12:00:00.000Z",
        ready_at: null,
        picked_up_at: null,
        expired_at: null,
        buyer_email: "hidden@example.com",
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
      }) as never,
    );
    const order = await loadShopOrderByPayToken("tok-1");
    expect(order?.status).toBe("paid");
    expect(order?.items[0]?.title).toBe("Hoodie");
    expect(order && "buyerEmail" in order).toBe(false);
  });
});
