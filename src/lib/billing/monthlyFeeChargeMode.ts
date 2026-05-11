export const MONTHLY_FEE_CHARGE_MODES = ["prorate_by_classes", "full_month_fee"] as const;

export type MonthlyFeeChargeMode = (typeof MONTHLY_FEE_CHARGE_MODES)[number];

export function parseMonthlyFeeChargeMode(raw: unknown): MonthlyFeeChargeMode {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (s === "full_month_fee") return "full_month_fee";
  return "prorate_by_classes";
}
