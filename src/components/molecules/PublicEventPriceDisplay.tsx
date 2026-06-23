import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import {
  formatEventMoneyAmount,
  resolveEventPublicPriceDisplay,
} from "@/lib/events/resolveEventPublicPriceDisplay";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

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
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function PublicEventPriceDisplay({
  source,
  currency,
  locale,
  labels,
  variant = "compact",
  surfaceVariant = "default",
}: PublicEventPriceDisplayProps) {
  const price = resolveEventPublicPriceDisplay(source, currency);
  const isEspacioZenit = surfaceVariant === "espaciozenit";
  const featuredClass = isEspacioZenit
    ? "text-2xl font-semibold tracking-tight text-[var(--ez-cyan-soft)]"
    : "text-2xl font-semibold tracking-tight text-[var(--color-secondary)]";
  const compactClass = isEspacioZenit
    ? "text-sm font-semibold text-neutral-100"
    : "text-sm font-semibold text-[var(--color-foreground)]";
  const labelClass = isEspacioZenit
    ? "text-xs font-medium uppercase tracking-wide text-neutral-400"
    : "text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]";
  const amountClass =
    variant === "featured"
      ? isEspacioZenit
        ? "text-lg font-semibold text-white"
        : "text-lg font-semibold text-[var(--color-foreground)]"
      : compactClass;

  if (price.kind === "free") {
    return (
      <p className={variant === "featured" ? featuredClass : compactClass}>
        {labels.free}
      </p>
    );
  }

  if (price.kind === "single") {
    return (
      <p className={variant === "featured" ? featuredClass : compactClass}>
        {formatEventMoneyAmount(price.amount, price.currency, locale)}
      </p>
    );
  }

  const localFormatted = formatEventMoneyAmount(price.localAmount, price.currency, locale);
  const nonLocalFormatted = formatEventMoneyAmount(price.nonLocalAmount, price.currency, locale);

  return (
    <ul className={variant === "featured" ? "space-y-3" : "space-y-1.5"}>
      <li className="flex items-baseline justify-between gap-3">
        <span className={labelClass}>{labels.priceLocal}</span>
        <span className={amountClass}>{localFormatted}</span>
      </li>
      <li className="flex items-baseline justify-between gap-3">
        <span className={labelClass}>{labels.priceNonLocal}</span>
        <span className={amountClass}>{nonLocalFormatted}</span>
      </li>
    </ul>
  );
}
