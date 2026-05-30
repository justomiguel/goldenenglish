import type { EventAttendeePaymentSummary } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

/** Bank-transfer attendees with pending/rejected payments (or no payment) may be removed by admins. */
export function canDeleteEventAttendee(payment: EventAttendeePaymentSummary | null): boolean {
  if (!payment) return true;
  if (payment.gatewayProvider) return false;
  return payment.status === "pending" || payment.status === "rejected";
}
