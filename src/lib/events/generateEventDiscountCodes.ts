export const EVENT_DISCOUNT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const CODE_LENGTH = 8;
const MAX_QUANTITY = 200;

export type GenerateEventDiscountCodesResult =
  | { ok: true; codes: string[] }
  | { ok: false; code: "quantity" | "exhausted" };

function oneCode(random: () => number): string {
  let text = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    const pick = Math.floor(random() * EVENT_DISCOUNT_CODE_ALPHABET.length);
    text += EVENT_DISCOUNT_CODE_ALPHABET[pick] ?? EVENT_DISCOUNT_CODE_ALPHABET[0];
  }
  return text;
}

/** Builds unique 8-character codes. `random` returns a number from 0 inclusive to 1 exclusive. */
export function generateEventDiscountCodes(input: {
  quantity: number;
  existing?: ReadonlySet<string>;
  random?: () => number;
}): GenerateEventDiscountCodesResult {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_QUANTITY) {
    return { ok: false, code: "quantity" };
  }
  const random = input.random ?? Math.random;
  const taken = new Set(input.existing ?? []);
  const codes: string[] = [];
  const attemptLimit = input.quantity * 30;
  let attempts = 0;
  while (codes.length < input.quantity) {
    attempts += 1;
    if (attempts > attemptLimit) return { ok: false, code: "exhausted" };
    const next = oneCode(random);
    const key = next.toLowerCase();
    if (taken.has(key)) continue;
    taken.add(key);
    codes.push(next);
  }
  return { ok: true, codes };
}
