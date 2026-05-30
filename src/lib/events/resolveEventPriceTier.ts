export interface EventPriceSource {
  price?: number | null;
  priceLocal?: number | null;
  priceNonLocal?: number | null;
}

export function resolveEventLocalPrice(source: EventPriceSource): number | null {
  const local = source.priceLocal ?? source.price ?? null;
  return local == null ? null : Number(local);
}

export function resolveEventNonLocalPrice(source: EventPriceSource): number | null {
  const local = resolveEventLocalPrice(source);
  const nonLocal = source.priceNonLocal ?? local;
  return nonLocal == null ? null : Number(nonLocal);
}

export function eventHasTieredPricing(source: EventPriceSource): boolean {
  const local = resolveEventLocalPrice(source);
  const nonLocal = resolveEventNonLocalPrice(source);
  if (local == null && nonLocal == null) return false;
  return (local ?? 0) !== (nonLocal ?? 0);
}

export function resolveEventPriceForResidency(
  source: EventPriceSource,
  isLocalResident: boolean,
): number | null {
  return isLocalResident ? resolveEventLocalPrice(source) : resolveEventNonLocalPrice(source);
}

export function eventRequiresPayment(source: EventPriceSource, isLocalResident: boolean): boolean {
  const amount = resolveEventPriceForResidency(source, isLocalResident);
  return amount != null && amount > 0;
}
