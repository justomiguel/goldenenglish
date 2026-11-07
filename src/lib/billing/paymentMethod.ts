import { z } from "zod";

export const PAYMENT_METHODS = ["cash", "transfer", "card", "gateway", "other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export type StaffFeePayment = {
  method: PaymentMethod;
  amount: number;
  paidOn: string;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayIsoDate(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** A real calendar date, not in the future, and not more than 366 days before `today`. */
export function parsePaidOn(raw: string | undefined, today: string): string | null {
  if (!raw || !ISO_DATE.test(today)) return null;
  const match = ISO_DATE.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  if (raw > today) return null;
  const todayMatch = ISO_DATE.exec(today);
  if (!todayMatch) return null;
  const todayDate = new Date(
    Date.UTC(Number(todayMatch[1]), Number(todayMatch[2]) - 1, Number(todayMatch[3])),
  );
  const days = (todayDate.getTime() - date.getTime()) / 86_400_000;
  if (days > 366) return null;
  return raw;
}

export function parseStaffFeeAmount(raw: number): number | null {
  if (!Number.isFinite(raw) || raw <= 0 || raw > 1_000_000_000) return null;
  return Math.round(raw * 100) / 100;
}

export function formatPaidWithMethod(input: {
  template: string;
  methodLabel: string;
  paidOn: string;
  locale: string;
}): string {
  const date = new Intl.DateTimeFormat(input.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${input.paidOn}T00:00:00Z`));
  return input.template.replace("{method}", input.methodLabel).replace("{date}", date);
}

export function paidMethodLine(input: {
  template: string | undefined;
  method: string | null | undefined;
  paidOn: string | null | undefined;
  locale: string;
  labels: Record<PaymentMethod, string | undefined>;
}): string | null {
  const parsed = paymentMethodSchema.safeParse(input.method);
  const methodLabel = parsed.success ? input.labels[parsed.data] : null;
  if (!parsed.success || !input.paidOn || !input.template || !methodLabel) return null;
  return formatPaidWithMethod({
    template: input.template,
    methodLabel,
    paidOn: input.paidOn,
    locale: input.locale,
  });
}
