import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import {
  eventHasTieredPricing,
  resolveEventLocalPrice,
  resolveEventNonLocalPrice,
} from "@/lib/events/resolveEventPriceTier";

export function formatEventListPrice(
  source: EventPriceSource,
  currency: string,
  labels: { free: string; tiered: (local: string, nonLocal: string) => string; single: (amount: string) => string },
): string {
  const local = resolveEventLocalPrice(source);
  const nonLocal = resolveEventNonLocalPrice(source);

  if ((local == null || local === 0) && (nonLocal == null || nonLocal === 0)) {
    return labels.free;
  }

  const localText = `${currency} ${(local ?? 0).toFixed(2)}`;
  if (!eventHasTieredPricing(source)) {
    return labels.single(localText);
  }

  return labels.tiered(localText, `${currency} ${(nonLocal ?? 0).toFixed(2)}`);
}
