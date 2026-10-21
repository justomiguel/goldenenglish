import { buildShopOrderPath } from "@/lib/site/publicSharePaths";
import { absoluteUrl } from "@/lib/site/publicUrl";
import type { ShopAssignActorRole, ShopOrderStatus } from "@/lib/shop/types";
import { canAssignShopOrder } from "@/lib/shop/canAssignShopOrder";

export type ShopOrderActionResult = { ok: true } | { ok: false; code: string };

export const ADMIN_SHOP_TRANSITIONS = ["ready_for_pickup", "picked_up", "cancelled"] as const;
export type AdminShopTransition = (typeof ADMIN_SHOP_TRANSITIONS)[number];

const STATUSES = new Set<ShopOrderStatus>([
  "pending_payment",
  "paid",
  "ready_for_pickup",
  "picked_up",
  "expired",
  "cancelled",
]);

export function parseShopOrderStatus(value: string): ShopOrderStatus | null {
  return STATUSES.has(value as ShopOrderStatus) ? (value as ShopOrderStatus) : null;
}

export function isAssignableShopOrderStatus(status: ShopOrderStatus): boolean {
  return status === "paid" || status === "ready_for_pickup";
}

export function shopOrderTransitionPatch(
  to: AdminShopTransition,
  now: string,
): Record<string, string> {
  if (to === "ready_for_pickup") return { status: to, ready_at: now };
  if (to === "picked_up") return { status: to, picked_up_at: now };
  return { status: to };
}

export function mayAssignShopOrder(input: {
  actorRole: ShopAssignActorRole;
  actorId: string;
  buyerId: string;
  childIds: readonly string[];
  studentId: string | null;
}): boolean {
  if (input.studentId === null) {
    if (input.actorRole === "admin") return true;
    return input.actorRole === "parent" && input.actorId === input.buyerId;
  }
  return canAssignShopOrder({
    actorRole: input.actorRole,
    actorId: input.actorId,
    buyerId: input.buyerId,
    childIds: input.childIds,
    studentId: input.studentId,
  });
}

export function shopOrderReadyMailVars(
  locale: string,
  payToken: string,
  productTitle = "",
): {
  orderUrl: string;
  pickupNote: string;
} {
  const loc = locale === "en" || locale === "pt" ? locale : "es";
  const path = buildShopOrderPath(loc, productTitle, payToken);
  return {
    orderUrl: absoluteUrl(path)?.toString() ?? path,
    pickupNote:
      loc === "en"
        ? "Pick up at the institute during opening hours."
        : "Retiro en el instituto en horario de atención.",
  };
}
