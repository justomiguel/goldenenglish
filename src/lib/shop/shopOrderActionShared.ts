import { buildShopOrderPath } from "@/lib/site/publicSharePaths";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";

export type { AdminShopTransition } from "@/lib/shop/shopOrderStatus";
export {
  ADMIN_SHOP_TRANSITIONS,
  isAssignableShopOrderStatus,
  mayAssignShopOrder,
  parseShopOrderStatus,
  shopOrderTransitionPatch,
} from "@/lib/shop/shopOrderStatus";

export type ShopOrderActionResult = { ok: true } | { ok: false; code: string };

export async function shopOrderReadyMailVars(
  locale: string,
  payToken: string,
  productTitle = "",
): Promise<{
  orderUrl: string;
  pickupNote: string;
}> {
  const loc = locale === "en" || locale === "pt" ? locale : "es";
  const path = buildShopOrderPath(loc, productTitle, payToken);
  return {
    orderUrl: (await absoluteUrlForRequest(path))?.toString() ?? path,
    pickupNote:
      loc === "en"
        ? "Pick up at the institute during opening hours."
        : "Retiro en el instituto en horario de atención.",
  };
}
