const STABLE_EXACT = new Set([
  "event_flow_required",
  "event_tutor_required",
  "tutor_email_invalid",
  "invalid_body",
]);

const STABLE_PREFIX = /^(required_field_missing|file_too_large|file_mime_not_allowed|unknown_field):/;

const PATH_CODES: Record<string, string> = {
  firstName: "first_name_required",
  lastName: "last_name_required",
  dniOrPassport: "dni_required",
  email: "email_invalid",
  phone: "phone_required",
  birthDate: "birth_date_invalid",
  tutorEmail: "tutor_email_invalid",
  tutorFirstName: "event_tutor_required",
  tutorLastName: "event_tutor_required",
  tutorDniOrPassport: "event_tutor_required",
  tutorPhone: "event_tutor_required",
  tutorRelationship: "event_tutor_required",
};

export interface EventEnrollIssue {
  message: string;
  path: ReadonlyArray<PropertyKey>;
}

/** Turn a Zod issue into a code the registration form can translate. */
export function eventEnrollIssueCode(issue: EventEnrollIssue): string {
  const message = issue.message.trim();
  if (STABLE_EXACT.has(message) || STABLE_PREFIX.test(message)) return message;

  const key = [...issue.path].reverse().find((part) => typeof part === "string");
  if (typeof key === "string" && PATH_CODES[key]) return PATH_CODES[key];
  return "invalid_body";
}
