import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import {
  formatEventMoneyAmount,
  resolveEventPublicPriceDisplay,
} from "@/lib/events/resolveEventPublicPriceDisplay";

interface PublicEventPriceDisplayProps {
  source: EventPriceSource;
  currency: string;
  locale: string;
  labels: {
    free: string;
    priceLocal: string;
    priceNonLocal: string;
  };
  /** Larger typography for detail sidebar */
  variant?: "compact" | "featured";
}

export function PublicEventPriceDisplay({
  source,
  currency,
  locale,
  labels,
  variant = "compact",
}: PublicEventPriceDisplayProps) {
  const price = resolveEventPublicPriceDisplay(source, currency);

  if (price.kind === "free") {
    return (
      <p
        className={
          variant === "featured"
            ? "text-2xl font-semibold tracking-tight text-[var(--color-secondary)]"
            : "text-sm font-semibold text-[var(--color-foreground)]"
        }
      >
        {labels.free}
      </p>
    );
  }

  if (price.kind === "single") {
    return (
      <p
        className={
          variant === "featured"
            ? "text-2xl font-semibold tracking-tight text-[var(--color-secondary)]"
            : "text-sm font-semibold text-[var(--color-foreground)]"
        }
      >
        {formatEventMoneyAmount(price.amount, price.currency, locale)}
      </p>
    );
  }

  const localFormatted = formatEventMoneyAmount(price.localAmount, price.currency, locale);
  const nonLocalFormatted = formatEventMoneyAmount(price.nonLocalAmount, price.currency, locale);

  return (
    <ul className={variant === "featured" ? "space-y-3" : "space-y-1.5"}>
      <li className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {labels.priceLocal}
        </span>
        <span
          className={
            variant === "featured"
              ? "text-lg font-semibold text-[var(--color-foreground)]"
              : "text-sm font-semibold text-[var(--color-foreground)]"
          }
        >
          {localFormatted}
        </span>
      </li>
      <li className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {labels.priceNonLocal}
        </span>
        <span
          className={
            variant === "featured"
              ? "text-lg font-semibold text-[var(--color-foreground)]"
              : "text-sm font-semibold text-[var(--color-foreground)]"
          }
        >
          {nonLocalFormatted}
        </span>
      </li>
    </ul>
  );
}
