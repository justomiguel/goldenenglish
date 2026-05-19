import type { Locale } from "@/types/i18n";

export interface ParentPaymentsPickerOptionLabels {
  pending: string;
  settled: string;
}

function formatAmount(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Visible label for the parent payments child `<select>` (name + pending total or settled). */
export function formatParentPaymentsPickerOption(
  locale: Locale,
  displayName: string,
  subtotal: number,
  labels: ParentPaymentsPickerOptionLabels,
): string {
  if (subtotal <= 0) {
    return labels.settled.replace("{name}", displayName);
  }
  const amount = `$${formatAmount(locale, subtotal)}`;
  return labels.pending.replace("{name}", displayName).replace("{amount}", amount);
}
