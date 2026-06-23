export type EventPaymentReturnStatus = "success" | "failure" | "pending" | "processing";

/** Builds the absolute return-bridge URL the gateway sends the payer back to. */
export function buildEventPaymentReturnUrl(
  origin: string,
  locale: string,
  slug: string,
  status: EventPaymentReturnStatus,
): string {
  const url = new URL("/api/events/payment-return", origin);
  url.searchParams.set("locale", locale);
  url.searchParams.set("slug", slug);
  url.searchParams.set("status", status);
  return url.toString();
}

const ALLOWED_PAYMENT_STATUSES: readonly EventPaymentReturnStatus[] = [
  "success",
  "failure",
  "pending",
  "processing",
];

/** Normalizes an arbitrary `?payment=` value to a known banner status (or null). */
export function normalizeEventPaymentBannerStatus(
  raw: string | null | undefined,
): EventPaymentReturnStatus | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return (ALLOWED_PAYMENT_STATUSES as readonly string[]).includes(value)
    ? (value as EventPaymentReturnStatus)
    : null;
}
