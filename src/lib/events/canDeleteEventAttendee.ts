import type { EventAttendeePaymentSummary } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

/** Any attendee may be removed. Gateway and approved payments are included; the dialog warns that money is not refunded. */
export function canDeleteEventAttendee(_payment: EventAttendeePaymentSummary | null): boolean {
  return true;
}
