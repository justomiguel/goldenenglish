const ZERO_DECIMAL_CURRENCIES = new Set(["CLP", "ARS"]);

export function roundEventMoney(amount: number, currency: string): number {
  const digits = ZERO_DECIMAL_CURRENCIES.has(currency.trim().toUpperCase()) ? 0 : 2;
  const factor = 10 ** digits;
  return Math.round(amount * factor) / factor;
}

export interface EventFixedAmountDiscount {
  covered: number;
  extra: number;
  newUnit: number;
  total: number;
}

/** Money off a limited number of tickets. Extra tickets stay at the unit price. */
export function applyEventFixedAmountDiscount(input: {
  unitPrice: number;
  seats: number;
  discountAmount: number;
  ticketCount: number;
  currency: string;
}): EventFixedAmountDiscount {
  const seats = Math.max(1, Math.floor(input.seats));
  const covered = Math.min(seats, Math.max(0, Math.floor(input.ticketCount)));
  const extra = seats - covered;
  const unit = roundEventMoney(input.unitPrice, input.currency);
  const newUnit = roundEventMoney(Math.max(0, unit - input.discountAmount), input.currency);
  const total = roundEventMoney(covered * newUnit + extra * unit, input.currency);
  return { covered, extra, newUnit, total };
}
