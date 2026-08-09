import { periodIndex } from "@/lib/billing/scholarshipPeriod";

export interface EffectivePeriod {
  year: number;
  month: number;
}

/**
 * Selector de vigencias compartido: devuelve **todos** los items del período vigente más reciente que
 * no sea futuro respecto de `target`.
 *
 * Un plan de cuotas tiene un único item por vigencia, así que el llamador toma `[0]`. Un catálogo de
 * precios tiene varios tramos compartiendo la misma vigencia, y ahí importa recibir el grupo completo:
 * si la vigencia nueva solo re-coteó algunos tramos, los que no están dejaron de ofrecerse y no deben
 * caer al precio viejo.
 *
 * Devuelve lista vacía cuando ninguna vigencia aplica todavía.
 */
export function pickEffectiveForPeriod<T>(
  items: readonly T[],
  target: EffectivePeriod,
  getPeriod: (item: T) => EffectivePeriod,
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const targetIndex = periodIndex(target.year, target.month);

  let bestIndex = -Infinity;
  for (const item of items) {
    const period = getPeriod(item);
    const index = periodIndex(period.year, period.month);
    if (index <= targetIndex && index > bestIndex) bestIndex = index;
  }
  if (bestIndex === -Infinity) return [];

  return items.filter((item) => {
    const period = getPeriod(item);
    return periodIndex(period.year, period.month) === bestIndex;
  });
}
