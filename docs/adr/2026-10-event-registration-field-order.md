# ADR: Registration question order and optional required flags

## Context

Event registration always renders built-in participant fields first, then extra questions. The admin list shows a grip on extra fields, but it does not drag. Staff need to place a custom question among the base fields, and to require phone or date of birth on a specific event.

## Decision

Store `events.registration_field_order` as tokens (`base:firstName`, `field:<uuid>`, …). An empty array keeps today's order. A non-empty array is the attendee order; the resolver drops unknown or archived tokens and appends any visible field that is missing. `require_phone` and `require_birth_date` default to false. Birth date stays optional unless it is collected and the flag is on. Turning collection off clears `require_birth_date`. Consent, guardian, residency, and payment stay outside the sortable list.

## Options considered

- Reorder extra fields only. Rejected: phone could never move relative to a custom question.
- Encode base fields as rows in `event_form_fields`. Rejected: phone and birth date are columns on the attendee, not custom values.

## Consequences

- Existing events keep the current form until an admin reorders or marks a field required.
- New enrollments enforce the flags. Past attendees are unchanged.
- Admin saves write `system_config_audit` (`event_registration_field_order_updated`, `event_base_field_requirements_updated`).
