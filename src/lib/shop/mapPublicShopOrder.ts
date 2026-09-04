import type { ShopOrderStatus } from "@/lib/shop/types";

const STATUSES = new Set<ShopOrderStatus>([
  "pending_payment",
  "paid",
  "ready_for_pickup",
  "picked_up",
  "expired",
  "cancelled",
]);

export type PublicShopOrderItem = {
  title: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type PublicShopOrder = {
  id: string;
  status: ShopOrderStatus;
  currency: string;
  total: number;
  paidAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  expiredAt: string | null;
  items: PublicShopOrderItem[];
};

export type PublicShopOrderSource = {
  id: string;
  status: string;
  currency: string;
  total: number;
  paid_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  expired_at: string | null;
  shop_order_items?: Array<{
    title: string;
    size: string;
    color: string;
    sku: string;
    quantity: number;
    unit_price: number;
  }> | null;
};

export function mapPublicShopOrder(row: PublicShopOrderSource): PublicShopOrder | null {
  if (!STATUSES.has(row.status as ShopOrderStatus)) return null;
  return {
    id: row.id,
    status: row.status as ShopOrderStatus,
    currency: row.currency,
    total: Number(row.total),
    paidAt: row.paid_at,
    readyAt: row.ready_at,
    pickedUpAt: row.picked_up_at,
    expiredAt: row.expired_at,
    items: (row.shop_order_items ?? []).map((item) => ({
      title: item.title,
      size: item.size,
      color: item.color,
      sku: item.sku,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    })),
  };
}
