const ATTENDEE_PREFIX = "event_attendee:";
const PAYMENT_PREFIX = "event_payment:";

export type EventGatewayReference =
  | { kind: "attendee"; attendeeId: string }
  | { kind: "payment"; paymentId: string };

/** Builds the gateway external reference used to link a checkout back to an attendee. */
export function buildEventAttendeeReference(attendeeId: string): string {
  return `${ATTENDEE_PREFIX}${attendeeId}`;
}

/**
 * Parses a gateway external reference / commerce order back into its source entity.
 *
 * The deferred-creation flow links checkouts to the attendee (`event_attendee:<uuid>`),
 * while the legacy flow linked them to a pre-created payment row (`event_payment:<uuid>`).
 * Both are supported so in-flight legacy checkouts still reconcile after deploy.
 *
 * A retry-safe suffix (`event_attendee:<uuid>:<suffix>`) produced when re-initiating a
 * Flow checkout is tolerated and ignored.
 */
export function parseEventGatewayReference(
  raw: string | null | undefined,
): EventGatewayReference | null {
  const value = (raw ?? "").trim();

  if (value.startsWith(ATTENDEE_PREFIX)) {
    const id = value.slice(ATTENDEE_PREFIX.length).split(":")[0]?.trim() ?? "";
    return id ? { kind: "attendee", attendeeId: id } : null;
  }

  if (value.startsWith(PAYMENT_PREFIX)) {
    const id = value.slice(PAYMENT_PREFIX.length).split(":")[0]?.trim() ?? "";
    return id ? { kind: "payment", paymentId: id } : null;
  }

  return null;
}
