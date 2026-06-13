export type ScholarshipDiscountInputMode = "percent" | "monthly_amount" | "annual_amount";

export type DeriveScholarshipDiscountFailureCode =
  | "missing_reference"
  | "invalid_reference"
  | "invalid_target"
  | "target_above_reference"
  | "invalid_percent";

export type DeriveScholarshipDiscountResult =
  | {
      ok: true;
      discountPercent: number;
      payableMonthly: number;
      payableAnnual: number;
    }
  | { ok: false; code: DeriveScholarshipDiscountFailureCode };

export function roundScholarshipPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseScholarshipPercentInput(raw: string, minPercent = 0.5): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized.length === 0) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < minPercent || n > 100) return null;
  return roundScholarshipPercent(n);
}

function payableFromPercent(referenceMonthly: number, percent: number): {
  payableMonthly: number;
  payableAnnual: number;
} {
  const factor = Math.max(0, 1 - percent / 100);
  const payableMonthly = Math.round(referenceMonthly * factor * 100) / 100;
  const payableAnnual = Math.round(payableMonthly * 12 * 100) / 100;
  return { payableMonthly, payableAnnual };
}

export function deriveScholarshipDiscountPercent(params: {
  referenceMonthlyAmount: number | null | undefined;
  mode: ScholarshipDiscountInputMode;
  percentRaw?: string;
  monthlyAmountRaw?: string;
  annualAmountRaw?: string;
  minPercent?: number;
}): DeriveScholarshipDiscountResult {
  const minPercent = params.minPercent ?? 0.5;
  const referenceMonthly = params.referenceMonthlyAmount;

  if (params.mode === "percent") {
    const percent = parseScholarshipPercentInput(params.percentRaw ?? "", minPercent);
    if (percent == null) return { ok: false, code: "invalid_percent" };
    if (referenceMonthly == null || !Number.isFinite(referenceMonthly) || referenceMonthly <= 0) {
      return {
        ok: true,
        discountPercent: percent,
        payableMonthly: 0,
        payableAnnual: 0,
      };
    }
    const payables = payableFromPercent(referenceMonthly, percent);
    return { ok: true, discountPercent: percent, ...payables };
  }

  if (referenceMonthly == null || !Number.isFinite(referenceMonthly) || referenceMonthly <= 0) {
    return { ok: false, code: "missing_reference" };
  }

  const referenceFull =
    params.mode === "monthly_amount"
      ? referenceMonthly
      : Math.round(referenceMonthly * 12 * 100) / 100;

  const targetRaw =
    params.mode === "monthly_amount" ? params.monthlyAmountRaw : params.annualAmountRaw;
  const normalized = (targetRaw ?? "").trim().replace(",", ".");
  if (normalized.length === 0) return { ok: false, code: "invalid_target" };
  const target = Number(normalized);
  if (!Number.isFinite(target) || target < 0) return { ok: false, code: "invalid_target" };
  if (target > referenceFull) return { ok: false, code: "target_above_reference" };

  const discountPercent = roundScholarshipPercent(100 * (1 - target / referenceFull));
  if (discountPercent < minPercent) return { ok: false, code: "invalid_percent" };

  const payableMonthly =
    params.mode === "monthly_amount"
      ? Math.round(target * 100) / 100
      : Math.round((target / 12) * 100) / 100;
  const payableAnnual =
    params.mode === "annual_amount"
      ? Math.round(target * 100) / 100
      : Math.round(payableMonthly * 12 * 100) / 100;

  return {
    ok: true,
    discountPercent,
    payableMonthly,
    payableAnnual,
  };
}
