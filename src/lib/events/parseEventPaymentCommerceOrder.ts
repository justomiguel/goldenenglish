const EVENT_PAYMENT_PREFIX = "event_payment:";

/**
 * Extracts the event_payment UUID from a Flow `commerceOrder`.
 *
 * Supports both the original format `event_payment:<uuid>` and the retry-safe
 * format `event_payment:<uuid>:<suffix>` produced when re-initiating checkout.
 */
export function parseEventPaymentIdFromCommerceOrder(
  commerceOrder: string | null | undefined,
): string {
  const raw = (commerceOrder ?? "").trim();
  if (!raw.startsWith(EVENT_PAYMENT_PREFIX)) return "";
  const afterPrefix = raw.slice(EVENT_PAYMENT_PREFIX.length);
  return afterPrefix.split(":")[0]?.trim() ?? "";
}
