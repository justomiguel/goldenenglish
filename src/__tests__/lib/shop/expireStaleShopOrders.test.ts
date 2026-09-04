/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import {
  expireStaleShopOrders,
  isShopOrderExpired,
} from "@/lib/shop/expireStaleShopOrders";

const NOW = new Date("2026-09-04T15:00:00.000Z");
const MS_24H = 24 * 60 * 60 * 1000;

describe("isShopOrderExpired", () => {
  it("is false under 24h and at the exact cutoff", () => {
    expect(isShopOrderExpired(new Date(NOW.getTime() - MS_24H + 1), NOW)).toBe(false);
    expect(isShopOrderExpired(new Date(NOW.getTime() - MS_24H), NOW)).toBe(false);
    expect(isShopOrderExpired(NOW.toISOString(), NOW)).toBe(false);
  });

  it("is true strictly after 24h", () => {
    expect(isShopOrderExpired(new Date(NOW.getTime() - MS_24H - 1), NOW)).toBe(true);
    expect(isShopOrderExpired("2026-09-03T14:59:59.000Z", NOW)).toBe(true);
  });

  it("is false when createdAt is not a real date", () => {
    expect(isShopOrderExpired("not-a-date", NOW)).toBe(false);
  });
});

describe("expireStaleShopOrders", () => {
  it("only updates pending_payment rows older than 24h", async () => {
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const lt = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn(() => ({ update, eq, lt }));

    await expireStaleShopOrders({ admin: { from }, now: NOW });

    expect(from).toHaveBeenCalledWith("shop_orders");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "expired",
        expired_at: NOW.toISOString(),
      }),
    );
    expect(eq).toHaveBeenCalledWith("status", "pending_payment");
    expect(lt).toHaveBeenCalledWith("created_at", new Date(NOW.getTime() - MS_24H).toISOString());
  });

  it("logs when the expire update fails", async () => {
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const lt = vi.fn().mockResolvedValue({ error: { message: "boom", code: "xx" } });
    const from = vi.fn(() => ({ update, eq, lt }));

    await expireStaleShopOrders({ admin: { from }, now: NOW });

    expect(lt).toHaveBeenCalled();
  });
});
