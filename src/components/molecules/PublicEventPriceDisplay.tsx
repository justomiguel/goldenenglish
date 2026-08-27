import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import {
  formatEventMoneyAmount,
  resolveEventPublicPriceDisplay,
} from "@/lib/events/resolveEventPublicPriceDisplay";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventPriceChrome } from "@/lib/events/publicEventSurfaceClasses";

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
  const chrome = publicEventPriceChrome(surfaceVariant);
  const featuredClass = chrome.featured;
  const compactClass = chrome.compact;
  const labelClass = chrome.label;
  const amountClass = variant === "featured" ? chrome.featuredAmount : compactClass;

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

  // Package pricing is a comparison between several cards, which does not fit in
  // the meta row this component lives in. Surfaces in package mode render
  // PublicEventPackageCards as their own block instead.
  if (price.kind === "packages") return null;

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
