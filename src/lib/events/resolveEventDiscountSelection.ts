export type EventDiscountApplied =
  | { code: string; kind: "percent"; percent: number }
  | { code: string; kind: "amount"; discountAmount: number; ticketCount: number };

export interface EventDiscountSelection {
  family: boolean;
  applied: EventDiscountApplied | null;
}

/** Checking the family discount clears a code and restores the base price. */
export function selectEventFamilyDiscount(
  checked: boolean,
  applied: EventDiscountApplied | null,
): EventDiscountSelection {
  if (checked) return { family: true, applied: null };
  return { family: false, applied };
}

/** Applying a code clears the family checkbox. */
export function selectEventDiscountCode(next: EventDiscountApplied): EventDiscountSelection {
  return { family: false, applied: next };
}

export function clearEventDiscountCode(family: boolean): EventDiscountSelection {
  return { family, applied: null };
}
