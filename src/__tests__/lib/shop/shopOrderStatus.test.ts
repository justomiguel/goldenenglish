/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { canTransitionShopOrder } from "@/lib/shop/shopOrderStatus";

describe("canTransitionShopOrder", () => {
  it("allows pending_payment → paid|expired|cancelled", () => {
    expect(canTransitionShopOrder("pending_payment", "paid")).toBe(true);
    expect(canTransitionShopOrder("pending_payment", "picked_up")).toBe(false);
  });
  it("allows paid → ready_for_pickup|cancelled", () => {
    expect(canTransitionShopOrder("paid", "ready_for_pickup")).toBe(true);
  });
  it("allows ready_for_pickup → picked_up|cancelled", () => {
    expect(canTransitionShopOrder("ready_for_pickup", "picked_up")).toBe(true);
  });
});
