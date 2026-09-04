import { formatShopMoney } from "@/lib/shop/formatShopMoney";
import type { PublicShopOrder } from "@/lib/shop/mapPublicShopOrder";
import type { ShopOrderStatus as ShopOrderStatusCode } from "@/lib/shop/types";

export type ShopOrderStatusLabels = {
  title: string;
  pickup: string;
  items: string;
  total: string;
  quantity: string;
  status: Record<ShopOrderStatusCode, string>;
};

interface ShopOrderStatusProps {
  locale: string;
  order: PublicShopOrder;
  labels: ShopOrderStatusLabels;
}

export function ShopOrderStatus({ locale, order, labels }: ShopOrderStatusProps) {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h1>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          {labels.status[order.status]}
        </p>
        <p className="text-[var(--color-muted-foreground)]">{labels.pickup}</p>
      </header>
      <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.items}</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={`${item.sku}-${item.size}-${item.color}`} className="text-sm">
              <p className="font-medium text-[var(--color-foreground)]">{item.title}</p>
              <p className="text-[var(--color-muted-foreground)]">
                {item.size} · {item.color} · {labels.quantity} {item.quantity}
              </p>
              <p>{formatShopMoney(item.unitPrice * item.quantity, order.currency, locale)}</p>
            </li>
          ))}
        </ul>
        <p className="border-t border-[var(--color-border)] pt-3 text-sm font-semibold">
          {labels.total}: {formatShopMoney(order.total, order.currency, locale)}
        </p>
      </section>
    </main>
  );
}
