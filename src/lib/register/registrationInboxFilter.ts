export const REGISTRATION_INBOX_FILTERS = [
  "urgent",
  "awaiting_fee",
  "receipt_pending",
  "needs_section",
  "section_full",
  "contacted",
  "trial",
] as const;

export type RegistrationInboxFilter = (typeof REGISTRATION_INBOX_FILTERS)[number];

export function parseRegistrationInboxFilter(
  raw: string | undefined,
  legacyStatus?: string,
): RegistrationInboxFilter {
  if (legacyStatus === "contacted") return "contacted";
  if (REGISTRATION_INBOX_FILTERS.includes(raw as RegistrationInboxFilter)) {
    return raw as RegistrationInboxFilter;
  }
  return "urgent";
}

export function registrationInboxOrFilter(filter: RegistrationInboxFilter): string | null {
  if (filter === "urgent") {
    return [
      "intake_state.in.(receipt_pending,needs_section,section_full)",
      "and(intake_state.eq.none,fee_snapshot->>total.is.null)",
      "and(intake_state.eq.none,fee_snapshot->>total.eq.0)",
    ].join(",");
  }
  if (filter === "awaiting_fee") {
    return "intake_state.eq.awaiting_fee,and(intake_state.eq.none,fee_snapshot->>total.gt.0)";
  }
  if (filter === "receipt_pending" || filter === "needs_section" || filter === "section_full") {
    return `intake_state.eq.${filter}`;
  }
  if (filter === "trial") return "intent.eq.trial";
  return null;
}
