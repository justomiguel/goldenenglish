# Event registration fields — required flags and drag-and-drop order

**Intent:** On each event’s registration form, the admin can (1) mark the optional built-in fields (phone, and date of birth when it is collected) as required, and (2) drag the visible question fields into the order attendees see them. Name, last name, ID, email, and consent stay required. Existing events keep today’s behavior until an admin changes a flag or the order.

**Done when:**

- In **Instituto → Eventos → formulario**, phone and birth date (when collected) have a “required to register” control that persists per event.
- The same screen is one sortable list of question fields (built-in participant fields + extra fields). Drag-and-drop, and keyboard reorder, save the order. The public form renders questions in that order.
- Enrollment rejects an empty phone when `require_phone` is true, and an empty birth date when `require_birth_date` is true and birth date is collected.
- Copy exists in `en`, `es`, and `pt`. Staff changes are audited. Tests cover the validator, the order resolver, and the admin save path.

**Out of scope:**

- Making always-required base fields optional (first name, last name, ID, email, consent).
- Hiding phone or adding new base fields.
- Companion ticket fields (`companion_collect_*`).
- Putting consent, guardian, residency, payment method, or transfer receipt into the sortable list. Those stay in their current sections (footer / conditional blocks).
- A new drag-and-drop library. `@dnd-kit` is already installed.

## Context

`EVENT_REGISTRATION_BASE_FIELDS` hardcodes kind and display order:

| Field | Kind today | Where it renders |
| --- | --- | --- |
| firstName, lastName, dniOrPassport, email | required | Fixed block, then extras |
| phone | optional, always shown | Same block |
| birthDate | optional, only if `collect_birth_date` | Same block |
| consent | required | Footer |
| tutor, residency, payment | conditional | Their own sections |

Extra fields live in `event_form_fields.position` and render **after** the whole participant block. The admin list shows a grip icon on extras; it does not start a drag. `validateEventAttendeePayload` treats `phone` and `birthDate` as optional even when birth date is collected.

`position` on extras cannot express “a custom question between first name and phone.” A shared order on the event is required.

Public contract: `POST /api/events/[slug]/enroll` and `validateEventAttendeePayload`. Data: new columns on `public.events`. ADR required (`10-engineering-governance.mdc`).

## Decision

On `public.events`:

- `require_phone BOOLEAN NOT NULL DEFAULT false`
- `require_birth_date BOOLEAN NOT NULL DEFAULT false`
- `registration_field_order TEXT[] NOT NULL DEFAULT '{}'`

Empty `registration_field_order` means the legacy layout: built-in participant fields in today’s order, then extras by `position`. A non-empty array is the attendee order. Tokens are `base:firstName`, `base:lastName`, `base:dniOrPassport`, `base:email`, `base:phone`, `base:birthDate`, and `field:<uuid>` for an active extra field.

`require_birth_date` applies only when `collect_birth_date` is true. Turning collection off clears `require_birth_date`. Birth date may stay in the stored order while hidden; it is skipped on the public form until collection is on.

## Options considered

- Reorder extras only, leave built-in fields fixed on top. Rejected: phone could never move relative to extra questions, which is the order staff asked to control.
- Store order only in `event_form_fields.position` by inserting synthetic rows for phone. Rejected: phone is a column on `event_attendees`, not a custom value.
- Add another drag library. Rejected: `@dnd-kit/core` + `@dnd-kit/sortable` already power the global-content materials list.

## Behavior

1. **Required flags** (Tier B admin). On the phone and birth-date rows only:
   - Phone checkbox, default off.
   - Birth-date checkbox enabled only while “ask for date of birth” is on. Saving required while collection is off fails validation. Unchecking collection sets `require_birth_date` to false in the same update.
   - Name, last name, ID, email, and consent stay locked as required. Conditional rows stay badges, not in the drag list.
2. **Order.** One list: visible built-in question fields plus active extras. `@dnd-kit` with pointer and keyboard sensors (same pattern as `AdminGlobalContentMaterialsPanel`). Drop writes the full token array. New extra fields append to the end. Archiving an extra removes its token. Unknown or archived tokens are dropped when resolving. Any visible field missing from the array is appended in legacy order so a field cannot disappear.
3. **Public form.** Question fields render in the resolved order (one sequence, not “participant block then extras”). `required` on phone / birth date follows the flags. Consent, tutor, residency, and payment stay where they are now.
4. **Server.** `validateEventAttendeePayload` requires a non-empty phone (max 40) when `requirePhone` is true, and a `YYYY-MM-DD` birth date when `requireBirthDate && collectBirthDate`. Order does not change what is stored, only presentation. The enroll route passes the flags from the event row.
5. **Persistence.** Additive migration. Server actions revalidate admin event detail and the public event + register routes. Client `router.refresh()` after success.
6. **Audit.** `recordSystemAudit`: `event_base_field_requirements_updated` with `{ require_phone, require_birth_date }`, and `event_registration_field_order_updated` with the token array (ids only, no PII).
7. **Copy.** Keys under `dashboard.admin.events.form` in `en.json`, `es.json`, and `pt.json`, including drag handle `aria-label`s and the required checkbox.

## Consequences

- Existing events: both required flags false and order `{}` → same form as today.
- Past attendees are unchanged; required rules apply to new enrollments.
- `event_form_fields.position` remains the tie-break for extras that are not yet in an explicit order (empty array, or a field added before the order is saved).

## Tests

- Pure order resolver: empty array = legacy; explicit array interleaves `base:*` and `field:*`; hidden birth date is omitted; missing fields append; archived ids drop.
- Validator: phone required / optional; birth date required only when collected.
- Admin action: authz denial, order persisted, audit called.

## Manual QA (user)

- Drag phone below an extra field, reload the public form, confirm that order.
- Reorder with the keyboard.
- Phone optional: submit without a phone. Phone required: browser and API block an empty phone.
- Birth date not collected: it is not on the form. Collected and required: empty date is rejected.
