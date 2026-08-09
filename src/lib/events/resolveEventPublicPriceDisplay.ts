import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import {
  eventHasTieredPricing,
  resolveEventLocalPrice,
  resolveEventNonLocalPrice,
} from "@/lib/events/resolveEventPriceTier";

export interface EventPublicPackageDisplay {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  /** Null when the package has no capacity of its own. */
  remainingSeats: number | null;
}

export type EventPublicPriceDisplay =
  | { kind: "free" }
  | { kind: "single"; amount: number; currency: string }
  | { kind: "tiered"; localAmount: number; nonLocalAmount: number; currency: string }
  | { kind: "packages"; currency: string; packages: EventPublicPackageDisplay[] };

export function resolveEventPublicPriceDisplay(
  source: EventPriceSource,
  currency: string,
  activePackages: EventPublicPackageDisplay[] = [],
): EventPublicPriceDisplay {
  // Package mode wins outright: in it the residency tiers no longer decide the
  // amount, so showing them alongside would be showing a price nobody pays (D1).
  if (activePackages.length > 0) {
    return { kind: "packages", currency, packages: activePackages };
  }

  const local = resolveEventLocalPrice(source);
  const nonLocal = resolveEventNonLocalPrice(source);

  if ((local == null || local === 0) && (nonLocal == null || nonLocal === 0)) {
    return { kind: "free" };
  }

  if (!eventHasTieredPricing(source)) {
    return { kind: "single", amount: local ?? nonLocal ?? 0, currency };
  }

  return {
    kind: "tiered",
    localAmount: local ?? 0,
    nonLocalAmount: nonLocal ?? 0,
    currency,
  };
}

export function formatEventMoneyAmount(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
