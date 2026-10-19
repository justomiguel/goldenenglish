import {
  formatEventFlowPriceLabel,
  type EventFlowPrice,
} from "@/lib/events/formatEventFlowPrice";

interface EventFlowPriceListProps {
  flows: readonly EventFlowPrice[];
  currency: string;
  locale: string;
  freeLabel: string;
}

export function EventFlowPriceList({ flows, currency, locale, freeLabel }: EventFlowPriceListProps) {
  if (flows.length === 0) {
    return <p className="font-semibold text-[var(--color-foreground)]">{freeLabel}</p>;
  }

  return (
    <ul className="space-y-1">
      {flows.map((flow) => (
        <li key={flow.id} className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--color-foreground)]">{flow.name}</span>
          <span className="font-semibold tabular-nums text-[var(--color-primary)]">
            {formatEventFlowPriceLabel({ price: flow.price, currency, locale, freeLabel })}
          </span>
        </li>
      ))}
    </ul>
  );
}
