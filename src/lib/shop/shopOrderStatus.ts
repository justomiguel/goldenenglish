import type { ShopOrderStatus } from "@/lib/shop/types";

const ALLOWED_TRANSITIONS: Readonly<Record<ShopOrderStatus, readonly ShopOrderStatus[]>> = {
  pending_payment: ["paid", "expired", "cancelled"],
  paid: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["picked_up", "cancelled"],
  picked_up: [],
  expired: [],
  cancelled: [],
};

export function canTransitionShopOrder(from: ShopOrderStatus, to: ShopOrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
