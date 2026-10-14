# Event email copies

## Context

The institute catalog `email_templates` stores one subject and body per template key and locale. Event mail needs its own wording, and the two confirmation mails need a different wording per registration flow. Encoding that into the catalog key, or into columns on `events`, would mix a shared catalog with per-event copy.

## Decision

Store copies in `event_email_templates`, one row per event, optional flow, template key, and locale. Only `events.registered` and `events.payment_approved` may set `flow_id`. Sending resolves the flow row, then the event row, then the institute template. Variable values are HTML-escaped before substitution. The attendee stores `registration_locale` so later mails use the language of the form.

## Options considered

- Extra keys in `email_templates` (`events.registered.<eventId>`). Rejected: the catalog is institute-wide and the key would carry a foreign id.
- HTML columns on `events` and `event_registration_flows`. Rejected: four mails times three locales do not fit a few columns, and a flow would not own the rejection or reminder.

## Consequences

Staff edit copies on the event Notifications tab. A save writes only the selected scope. Sends that fail are logged and do not undo enrollment or payment. The institute template remains the fallback until a copy is saved. Tests cover selection, escaping, the flow-scope check, and the enrollment send.
