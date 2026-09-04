import type { CanAssignShopOrderInput } from "@/lib/shop/types";

export function canAssignShopOrder(input: CanAssignShopOrderInput): boolean {
  if (input.actorRole === "admin") return true;
  if (input.actorRole === "student") return false;
  if (input.actorRole !== "parent") return false;
  if (input.actorId !== input.buyerId) return false;
  return input.childIds.includes(input.studentId);
}
