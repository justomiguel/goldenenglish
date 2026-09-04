/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { canAssignShopOrder } from "@/lib/shop/canAssignShopOrder";

describe("canAssignShopOrder", () => {
  it("admin may assign any student", () => {
    expect(
      canAssignShopOrder({
        actorRole: "admin",
        buyerId: "b",
        actorId: "a",
        childIds: [],
        studentId: "s",
      }),
    ).toBe(true);
  });
  it("parent buyer may assign only linked children", () => {
    expect(
      canAssignShopOrder({
        actorRole: "parent",
        buyerId: "p",
        actorId: "p",
        childIds: ["s1"],
        studentId: "s1",
      }),
    ).toBe(true);
    expect(
      canAssignShopOrder({
        actorRole: "parent",
        buyerId: "p",
        actorId: "p",
        childIds: ["s1"],
        studentId: "s2",
      }),
    ).toBe(false);
  });
  it("student cannot assign", () => {
    expect(
      canAssignShopOrder({
        actorRole: "student",
        buyerId: "p",
        actorId: "s",
        childIds: [],
        studentId: "s",
      }),
    ).toBe(false);
  });
});
