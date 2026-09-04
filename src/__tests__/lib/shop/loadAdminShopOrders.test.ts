/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expireStaleShopOrders } from "@/lib/shop/expireStaleShopOrders";

vi.mock("@/lib/shop/expireStaleShopOrders", () => ({
  expireStaleShopOrders: vi.fn(),
}));

import { loadAdminShopOrders } from "@/lib/shop/loadAdminShopOrders";

describe("loadAdminShopOrders", () => {
  beforeEach(() => {
    vi.mocked(expireStaleShopOrders).mockReset();
    vi.mocked(expireStaleShopOrders).mockResolvedValue(undefined);
  });

  it("expires stale pending orders before listing", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    await loadAdminShopOrders({ supabase: { from } as never });
    expect(expireStaleShopOrders).toHaveBeenCalledTimes(1);
  });
});
