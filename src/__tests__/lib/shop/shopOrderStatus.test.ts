/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  canTransitionShopOrder,
  isAssignableShopOrderStatus,
  mayAssignShopOrder,
  parseShopOrderStatus,
  shopOrderTransitionPatch,
} from "@/lib/shop/shopOrderStatus";

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

  it("parses statuses and builds the admin patch", () => {
    expect(parseShopOrderStatus("paid")).toBe("paid");
    expect(parseShopOrderStatus("nope")).toBeNull();
    expect(isAssignableShopOrderStatus("paid")).toBe(true);
    expect(isAssignableShopOrderStatus("pending_payment")).toBe(false);
    expect(shopOrderTransitionPatch("ready_for_pickup", "t").ready_at).toBe("t");
    expect(shopOrderTransitionPatch("picked_up", "t").picked_up_at).toBe("t");
    expect(shopOrderTransitionPatch("cancelled", "t")).toEqual({ status: "cancelled" });
  });

  it("lets an admin assign an unassigned order and a parent assign their own", () => {
    expect(
      mayAssignShopOrder({
        actorRole: "admin",
        actorId: "a",
        buyerId: "b",
        childIds: [],
        studentId: null,
      }),
    ).toBe(true);
    expect(
      mayAssignShopOrder({
        actorRole: "parent",
        actorId: "b",
        buyerId: "b",
        childIds: [],
        studentId: null,
      }),
    ).toBe(true);
    expect(
      mayAssignShopOrder({
        actorRole: "parent",
        actorId: "a",
        buyerId: "b",
        childIds: [],
        studentId: null,
      }),
    ).toBe(false);
  });
});
