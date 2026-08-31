import { listClassPackTiersForPeriod } from "@/lib/billing/resolveClassPackPrice";
import type { ClassPackPrice } from "@/types/classPack";

export type FirstClassPackTuition = {
  amount: number;
  currency: string;
  classCount: number;
  priceId: string;
};

/** Smallest current catalog tier — used as the first tuition charge in class-pack convert. */
export function firstClassPackTuition(
  prices: readonly ClassPackPrice[],
  year: number,
  month: number,
): FirstClassPackTuition | null {
  const first = listClassPackTiersForPeriod(prices, year, month)[0];
  if (!first || !(first.amount > 0)) return null;
  return {
    amount: first.amount,
    currency: first.currency,
    classCount: first.classCount,
    priceId: first.id,
  };
}
