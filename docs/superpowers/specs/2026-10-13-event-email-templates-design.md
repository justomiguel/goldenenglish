# Event email templates

**Intent:** On an event’s Notificaciones tab, an admin edits the four event emails with the existing visual editor. Registration-received and payment-approved can also have a copy per registration flow. Every send uses that copy, then the event copy, then the institute template.

**Done when:**

- The Notificaciones tab edits subject and body for `events.registered`, `events.payment_approved`, `events.payment_rejected`, and `events.reminder`, in `es`, `en`, and `pt`.
- The visual editor is the existing email TipTap field. A chip inserts each variable.
- `events.registered` and `events.payment_approved` can be saved for one flow. The other two keys accept only an event-level copy.
- A flow without its own copy uses the event copy. An event without a copy uses the institute `email_templates` row, then the code default.
- Enrollment sends `events.registered`. Approving a payment sends `events.payment_approved`. Rejecting a payment sends `events.payment_rejected`. The reminder cron sends `events.reminder` with the event copy.
- Variable values are HTML-escaped before substitution. Saved HTML passes `sanitizeEmailTemplateHtml`. An empty result is rejected.
- Admins only. Each save writes `recordSystemAudit` without the HTML body.

**Out of scope:** New email kinds, attachments, a “send me a test” button, editing the institute-wide template catalog, and per-flow copies of rejection or reminder.

## Decision

Store per-event copies in `public.event_email_templates`. Leave `email_templates` as the institute catalog.

ADR: `docs/adr/2026-10-event-email-templates.md` (written with the implementation).

## Data

Migration `212_event_email_templates.sql` (additive):

- `event_email_templates`: `id`, `event_id` (FK `events` on delete cascade), `flow_id` (nullable FK `event_registration_flows` on delete cascade), `template_key`, `locale`, `subject`, `body_html`, `updated_at`, `updated_by`.
- `flow_id` is allowed only when `template_key` is `events.registered` or `events.payment_approved`.
- One row per (`event_id`, `flow_id`, `template_key`, `locale`). Partial unique indexes so a null `flow_id` still collides.
- `locale` is `es`, `en`, or `pt`. Subject and body are non-empty.
- RLS: `is_admin()` for all operations. Sends use the admin client. No public read.
- `event_attendees.registration_locale text not null default 'es'` with the same locale check. Enrollment writes the page locale.

## Resolution

`resolveEventEmailCopy({ eventId, flowId, templateKey, locale, vars })`:

1. For a confirmation key with a `flowId`, load that flow row for the locale.
2. Otherwise, or when that row is missing, load the event row (`flow_id` null) for the locale.
3. Otherwise `loadEmailTemplate` (institute override, then registry default).
4. Escape each variable for HTML, then `fillTemplate` on subject and body.

Variables, present on every event mail:

| Token | Value |
| --- | --- |
| `firstName` | Attendee given name |
| `lastName` | Attendee surname |
| `eventName` | Event title |
| `flowName` | Flow name, or empty when the attendee has no flow |
| `eventDate` | Event date formatted with `Intl` in the mail locale |
| `eventLocation` | Event location, or empty |

The reminder cron does not pass a flow id into the copy lookup. It still fills `flowName` from the attendee’s flow when one exists.

## Sends

| Moment | Key | Locale |
| --- | --- | --- |
| Successful enroll (`confirmed`, `pending_payment`, or `waitlist`) | `events.registered` | Page locale, stored on the attendee |
| Payment approved (staff review and gateway finalize) | `events.payment_approved` | `registration_locale` |
| Payment rejected | `events.payment_rejected` | `registration_locale` |
| Reminder cron | `events.reminder` | `registration_locale` |

A failed send is logged with `[ge:server]` and does not roll back the enrollment or the payment. `notifyAttendeeViaResend` gains `eventId`, optional `flowId`, and `vars`, and calls `resolveEventEmailCopy` before `sendBrandedEmail`.

## Admin UI

Tier B. The existing Notificaciones tab replaces the placeholder sentence.

- Four mail choices. Subject field plus `EmailTemplateBodyField` (visual editor first).
- Locale switcher (`es` / `en` / `pt`). Switching loads that locale’s saved copy or the fallback text.
- Variable chips insert `{{token}}` into the body.
- For the two confirmation keys, when the event has at least one flow, a control selects “todo el evento” or one flow. Rejection and reminder hide that control.
- Save persists the current scope. The screen shows the fallback text until a copy exists for that scope.
- A sample preview replaces variables with example values. It does not send mail.
- `revalidatePath` on the event admin route and `router.refresh()` after a successful save.

Copy lives in `src/dictionaries/en.json`, `es.json`, and `pt.json`. Spanish is neutral Latin American tuteo. Buttons use a leading Lucide icon.

## Tests

- Flow copy wins over the event copy; a missing flow copy uses the event copy; a missing event copy uses the institute template.
- Saving a `flow_id` on reminder or rejection is rejected.
- Sanitizer strips a script tag; a body that sanitizes to empty is rejected.
- Enroll sends `events.registered` with escaped variables and the attendee’s flow id.
- Reminder lookup ignores flow id.
