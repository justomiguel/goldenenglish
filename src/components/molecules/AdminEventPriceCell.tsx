import { EventFlowPriceList } from "@/components/molecules/EventFlowPriceList";
import type { EventFlowPrice } from "@/lib/events/formatEventFlowPrice";

interface AdminEventPriceCellProps {
  priceByFlow: boolean;
  flowPrices: readonly EventFlowPrice[];
  price: number | null;
  currency: string;
  locale: string;
  freeLabel: string;
}

export function AdminEventPriceCell({
  priceByFlow,
  flowPrices,
  price,
  currency,
  locale,
  freeLabel,
}: AdminEventPriceCellProps) {
  if (priceByFlow) {
    return (
      <EventFlowPriceList
        flows={flowPrices}
        currency={currency}
        locale={locale}
        freeLabel={freeLabel}
      />
    );
  }

  return <span>{price == null ? freeLabel : `${currency} ${price.toFixed(2)}`}</span>;
}
