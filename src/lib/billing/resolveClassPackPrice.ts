import { pickEffectiveForPeriod } from "@/lib/billing/pickEffectiveForPeriod";
import type { ClassPackPrice } from "@/types/classPack";

export type ClassPackPriceResult =
  | { code: "ok"; amount: number; currency: string; priceId: string }
  | { code: "no_tier" };

function effectiveTiers(
  prices: readonly ClassPackPrice[],
  year: number,
  month: number,
): ClassPackPrice[] {
  const active = (prices ?? []).filter((price) => price.archivedAt == null);
  return pickEffectiveForPeriod(active, { year, month }, (price) => ({
    year: price.effectiveFromYear,
    month: price.effectiveFromMonth,
  }));
}

/**
 * Tramos ofrecibles para un período, ordenados por cantidad de clases.
 */
export function listClassPackTiersForPeriod(
  prices: readonly ClassPackPrice[],
  year: number,
  month: number,
): ClassPackPrice[] {
  return effectiveTiers(prices, year, month).sort((a, b) => a.classCount - b.classCount);
}

/**
 * Precio **total** de un paquete de `classCount` clases para el período dado.
 *
 * Coincidencia exacta de `classCount` dentro de la vigencia en curso. **No interpola**: un tramo que
 * no existe es `no_tier`, no un monto calculado. La no linealidad del catálogo es el requisito
 * (2 clases no valen 2 × 1 clase), así que cualquier fórmula de relleno inventaría precios que el
 * instituto nunca cargó.
 */
export function resolveClassPackPrice(
  prices: readonly ClassPackPrice[],
  classCount: number,
  year: number,
  month: number,
): ClassPackPriceResult {
  if (!Number.isInteger(classCount) || classCount <= 0) return { code: "no_tier" };

  const tier = effectiveTiers(prices, year, month).find(
    (price) => price.classCount === classCount,
  );
  if (!tier) return { code: "no_tier" };

  return { code: "ok", amount: tier.amount, currency: tier.currency, priceId: tier.id };
}
