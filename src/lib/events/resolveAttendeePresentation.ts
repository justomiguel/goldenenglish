export type AttendeePresentationTone = "success" | "warning" | "error" | "muted";

export function resolveAttendeeRegistrationStatusTone(status: string): AttendeePresentationTone {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending_payment":
      return "warning";
    case "cancelled":
      return "error";
    case "waitlist":
      return "muted";
    default:
      return "muted";
  }
}

export function resolveAttendeePaymentStatusTone(
  status: string | undefined,
): AttendeePresentationTone {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "error";
    default:
      return "muted";
  }
}

export function buildAttendeeInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}
