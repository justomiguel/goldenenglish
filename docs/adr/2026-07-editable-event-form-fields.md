# ADR: Editable event form fields after create

## Context

Admin event registration forms support custom `event_form_fields` (including select/combo
options in `options_i18n`). The first ship only exposed **create** and soft-**archive**.
Operators who needed more select options had to archive the field and create a new one,
which also blocked reusing the same `field_key` because of `UNIQUE (event_id, field_key)`.

## Decision

Add `updateEventFormFieldAction` and an admin edit panel so active (non-archived) fields
can be updated in place:

- Editable: visible label (locale merge into `label_i18n`), `required`, select options
  (locale merge into `options_i18n`), and file/image MIME allow-lists.
- Immutable after create: `field_key`, `field_type`.
- Soft-archive remains the retirement path; no unarchive in this change.
- Mutations revalidate admin detail and public event/register routes and write
  `system_config_audit` (`event_form_field_updated`).

## Options considered

- Keep archive-and-recreate only: rejected — poor UX for additive select options and
  conflicts with unique `field_key`.
- Allow changing `field_type`: rejected — would reinterpret stored
  `event_attendee_field_values` (`value_text` / files).

## Consequences

- Existing attendee answers stay keyed by `field_id`; historical select `value_text`
  may no longer match the current option list if options are renamed or removed.
- Enrollment still does not whitelist select values against `options_i18n` (pre-existing).
- Reorder of fields (`position`) remains out of scope.
