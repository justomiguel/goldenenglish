import { sumShopLines } from "@/lib/shop/shopLineTotals";
import type { ShopCheckoutFailCode, ShopCheckoutLine } from "@/lib/shop/types";

export type ShopVariantSnapshotRow = {
  id: string;
  stock: number;
  price: number;
  active: boolean;
  size: string;
  color: string;
  sku: string;
  shop_products: { title: string; active: boolean } | { title: string; active: boolean }[] | null;
};

export type ShopOrderItemSnapshot = {
  variant_id: string;
  quantity: number;
  unit_price: number;
  title: string;
  size: string;
  color: string;
  sku: string;
};

function productOf(row: ShopVariantSnapshotRow): { title: string; active: boolean } | null {
  const raw = row.shop_products;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export function evaluateShopCheckoutLines(
  lines: readonly ShopCheckoutLine[],
  variants: readonly ShopVariantSnapshotRow[],
):
  | { ok: true; items: ShopOrderItemSnapshot[]; total: number }
  | { ok: false; code: ShopCheckoutFailCode } {
  if (lines.length === 0) return { ok: false, code: "empty_cart" };
  const byId = new Map(variants.map((row) => [row.id, row]));
  const items: ShopOrderItemSnapshot[] = [];
  for (const line of lines) {
    if (line.quantity < 1) return { ok: false, code: "empty_cart" };
    const row = byId.get(line.variantId);
    const product = row ? productOf(row) : null;
    if (!row || !row.active || !product?.active) {
      return { ok: false, code: "inactive_variant" };
    }
    if (line.quantity > Number(row.stock)) {
      return { ok: false, code: "insufficient_stock" };
    }
    const unitPrice = Number(row.price);
    items.push({
      variant_id: row.id,
      quantity: line.quantity,
      unit_price: unitPrice,
      title: product.title,
      size: row.size,
      color: row.color,
      sku: row.sku,
    });
  }
  return { ok: true, items, total: sumShopLines(items.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unit_price,
  }))) };
}
