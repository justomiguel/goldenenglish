# Event code uses and duplicate event

**Intent:** Staff see who used each discount code. Staff duplicate an event as a new draft.

**Done when:**

- The Codes tab lists each redemption with the attendee name, email, use status, and payment status.
- An admin can duplicate an event. The copy is a draft. It has the form, flows, packages, prices, translations, and email templates. It has no attendees, payments, or discount codes.
- Tests cover the redemption list and the copy rules.

**Out of scope:** Check-in at the door. Editing the code text. Copying discount codes. Copying attendees or payments. A public list of who used a code.

## Code uses

The Codes tab keeps the current code table. Each code row can expand. The expansion lists that code's redemptions.

Each redemption shows:

- Name, surname first, from the attendee `first_name` and `last_name`.
- Email.
- Use status: reserved, consumed, or released.
- Payment status from `event_payments`, or a "no payment" label when that row is missing.

Load redemptions only when the admin tab is `codes`. Order by redemption `created_at` descending. Cap the list at 500 rows. If the cap is hit, show a short note. Do not add a public route.

No new table and no new migration. Read `event_discount_code_redemptions`, `event_attendees`, and `event_payments` through the existing admin client.

## Duplicate event

Put one Duplicate button on the event detail summary. The button has a leading icon. Copy comes from dictionaries.

The action:

1. Requires an admin.
2. Reads the source event. If it is missing, return a stable error code.
3. Inserts a new `events` row with `status = draft`, `show_on_home = false`, `view_count = 0`, and `created_by` set to the current admin.
4. Sets the title to the source title plus ` (copia)`. Builds a unique slug from that title. If the slug exists, append a short suffix.
5. Copies the other event columns that configure the event: schedule, location, capacity, prices, currency, bank instructions, locale, section privacy, form flags, question order, package flags, and description HTML.
6. Copies `event_translations`, `event_registration_flows`, `event_form_fields` (with the new flow ids), `event_ticket_packages`, and `event_email_templates` (with the new flow ids).
7. Does not copy attendees, field values, payments, discount codes, or redemptions.
8. Writes `recordSystemAudit` with action `event.duplicate`, the new event id, and the source event id. Do not log attendee emails.
9. Calls `revalidatePath` for the admin events list and the new detail page. The client calls `router.push` to the new event.

The copy stays a draft even when the source is published. The date is copied. Staff change it on the draft.

Description HTML and email HTML are copied as stored. Do not upload new media files. Shared storage URLs stay valid.

## Tests

- A code with one reserved redemption and one released redemption renders both names and the payment status.
- A redemption with no payment row shows the no-payment label.
- Duplicate copies a flow, a form field on that flow, a package, and an email template, and remaps flow ids.
- Duplicate does not copy attendees or discount codes.
- Duplicate sets draft, clears `show_on_home`, and sets `created_by` to the actor.
- A signed-out caller gets `forbidden` and no insert.

## Manual QA (user)

1. Open Codes on an event that has a used code. Expand the row. Confirm the name, email, and payment status.
2. Duplicate a published event. Confirm the new event is a draft, the form and emails match, and the attendee list and codes are empty.
