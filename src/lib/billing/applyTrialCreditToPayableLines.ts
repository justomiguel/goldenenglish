import type { PayableParentMonthLine } from "@/lib/billing/listPayableParentMonthSections";

export function applyTrialCreditToPayableLines(input: {
  lines: PayableParentMonthLine[];
  creditAvailable: number;
  enabled: boolean;
}): {
  lines: PayableParentMonthLine[];
  creditApplied: number;
  total: number;
} {
  const available = Math.max(0, Number(input.creditAvailable) || 0);
  if (!input.enabled || available <= 0) {
    const total = input.lines.reduce((sum, line) => sum + line.amount, 0);
    return { lines: input.lines, creditApplied: 0, total };
  }

  let remaining = available;
  const lines = input.lines.map((line) => {
    const take = Math.min(remaining, Math.max(0, line.amount));
    remaining -= take;
    return { ...line, amount: line.amount - take };
  });
  const creditApplied = available - remaining;
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, creditApplied, total };
}
