/** Statuses a lead can hold while it is still a lead. */
export const REGISTRATION_PENDING_STATUSES = ["new", "contacted"] as const;

/**
 * A lead stays editable and acceptable while it is still a lead. Marking it
 * contacted must not strand it, which is what happened while the gates only
 * accepted 'new'.
 */
export function registrationIsActionable(status: string): boolean {
  return (REGISTRATION_PENDING_STATUSES as readonly string[]).includes(status);
}
