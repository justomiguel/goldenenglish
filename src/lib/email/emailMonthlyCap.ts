export const EMAIL_MONTHLY_CAP_DEFAULT = 5000;
export const EMAIL_MONTHLY_CAP_MAX = 100_000;
export const EMAIL_MONTHLY_CAP_CODE = "email_monthly_cap";
export const EMAIL_MONTHLY_CAP_KEY = "email_monthly_cap";

export function acceptEmailMonthlyCapInput(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
  if (!Number.isInteger(n) || n < 1 || n > EMAIL_MONTHLY_CAP_MAX) return null;
  return n;
}

export function readEmailMonthlyCap(raw: unknown): number {
  return acceptEmailMonthlyCapInput(raw) ?? EMAIL_MONTHLY_CAP_DEFAULT;
}

export function emailSendFitsCap(input: {
  used: number;
  cap: number;
  recipientCount: number;
}): boolean {
  if (!Number.isInteger(input.recipientCount) || input.recipientCount < 1) return false;
  return input.used + input.recipientCount <= input.cap;
}
