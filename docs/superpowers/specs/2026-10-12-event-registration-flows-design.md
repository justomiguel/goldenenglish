# Event registration flows

**Intent:** An event registration form can stay one path, or split into several. Shared questions apply to everyone. Each extra path has its own questions. With two or more paths, the attendee picks one at the start and only sees that path’s fields. Price stays the event’s residency price unless staff turn on a per-flow price.

**Done when:**

- On **Instituto → Eventos → formulario**, staff can add, rename, reorder, and archive flows. An event with no flows (or one flow) keeps a single form and does not ask which path.
- Extra fields are either shared or belong to one flow. Staff order shared questions in the existing list, and order each flow’s questions inside that flow.
- With two or more active flows, the public form asks which flow first, then shows shared questions and only that flow’s questions.
- Enrollment stores the chosen flow, requires that flow’s required fields, and rejects answers for another flow’s fields.
- Price is the event residency price by default. Staff can switch the event to “price depends on the flow”; each flow then has its own amount, including 0 for free.
- Copy in `en`, `es`, and `pt`. Staff changes are audited. Tests cover flow resolution, enrollment validation, and the admin save path.

**Out of scope:**

- A third price beside residency and flow price. An event uses residency **or** flow prices **or** existing ticket packages, not two of them at once.
- Putting name, last name, ID, email, phone, birth date, consent, tutor, residency, or payment inside a flow. Those stay shared.
- Companion ticket fields.
- Branching inside a flow (a second question that reveals more fields).
- Editing a past attendee’s flow.

## Context

`event_form_fields` is one list per event. `registration_field_order` on `events` orders shared built-in questions and extras. Every attendee sees every active extra field. Ticket packages already sell different prices; they do not change which questions appear.

The form the staff built for the academy path is the single-flow case and must keep working. The same event also needs other audiences (courses plus championship, championship only) with different questions.

Public contract: `POST /api/events/[slug]/enroll` and `validateEventAttendeePayload`. Data: a new flows table and a nullable `flow_id` on extras. ADR required (`10-engineering-governance.mdc`).

## Decision

- New table `event_registration_flows`: `id`, `event_id`, `name_i18n` JSONB, `position` INT, `price NUMERIC(12,2) NULL`, `archived_at`, timestamps. Unique active name is not required; order is `position`. `price` is used only when the event prices by flow.
- `events.price_by_flow BOOLEAN NOT NULL DEFAULT false`. False keeps today’s residency price (`price_local` / `price_non_local`) for every path. True charges `event_registration_flows.price` for the path taken. Currency stays the event currency.
- `event_form_fields.flow_id UUID NULL` references a flow of the same event. `NULL` means the extra is shared.
- `event_attendees.registration_flow_id UUID NULL` records the path taken. Null on events that do not ask.
- Each flow stores `field_order TEXT[]` of `field:<uuid>` tokens for its own extras. Shared order stays `events.registration_field_order` and only includes shared tokens (`base:*` and shared `field:*`).
- Zero active flows: today’s form. Every extra is shared. No flow question. `registration_flow_id` stays null.
- One active flow: no flow question. The public form shows shared fields, then that flow’s fields. The server stores that flow id.
- Two or more active flows: the first control is a required choice (radio group, flow name). Then shared fields in shared order, then that flow’s fields in its order. Other flows’ fields are not rendered and are not required.

## Options considered

- Always charge a different price per flow. Rejected: staff can keep one residency price for the whole event and use flows only for questions.
- Treat each ticket package as a flow. Rejected: packages already mean price and seats. Flow price is a separate switch. An event that already has an active package cannot turn on `price_by_flow`, and flow pricing cannot be combined with a new package.
- One JSON document of the whole form on the event. Rejected: extras, files, and attendee values already live in `event_form_fields` and `event_attendee_field_values`.
- Show every flow’s fields on one long page with headings. Rejected: staff asked each person to see only their path.

## Behavior

1. **Admin (Tier B).** On the form tab, under the shared question list, the flows live in their own bordered container:
   - Button **Agregar flujo**, always available.
   - Each flow is a card: name (locale of the admin), drag order of its fields, and **Agregar campo** that creates the extra inside that flow.
   - The container above the flows holds the default questions and the shared extras. An extra dragged into a flow belongs only to that flow. Dropping it back on the shared container makes it shared again. Default questions stay in the shared container. The control that adds an extra field lives inside the container it adds to: the shared container for a shared extra, and that flow’s container for a flow-only extra.
   - Archiving a flow archives its extras with it. The public form drops that path. Past attendees keep `registration_flow_id`.
   - With one flow, the card is visible to staff and the public form still does not ask.
   - A switch **El precio depende del flujo**, off by default. Off: the summary residency prices apply to every path, and flow cards do not ask for a price. On: each flow card has an amount (empty is not allowed; 0 is free). Turning it on while the event has an active ticket package fails with a clear error. The public total uses that amount and ignores residency.
2. **Public form (Tier A).** One column, same register page. Flow choice uses dictionary chrome plus the flow name staff wrote. Changing the choice clears answers that belonged to the previous flow before submit.
3. **Server.** `validateEventAttendeePayload` receives `flowId` and the event’s active flows. It requires `flowId` when there are two or more flows, ignores field values whose `flow_id` is another flow, and still requires shared required fields plus the chosen flow’s required fields. The enroll route persists `registration_flow_id`. Seat price goes through `resolveEventSeatPrice`: a flow price wins when `price_by_flow` is on; otherwise residency (or an active package) wins, as today. The client cannot send the amount.
4. **Persistence.** Additive migration. RLS matches `event_form_fields`: public read of flows for a published public event; admin writes. Revalidate the admin event page and the public event and register routes. Client `router.refresh()` after a successful admin save.
5. **Audit.** `recordSystemAudit` with resource `event`: `event_registration_flow_saved` and `event_registration_flow_archived`. Payload is ids and position, not attendee answers.
6. **Copy.** `dashboard.admin.events.form.flows` in `en.json`, `es.json`, and `pt.json`. The public question label is dictionary copy; flow names are staff content.

## Consequences

- Existing events have no flow rows and null `flow_id` on extras, so the form stays as it is.
- A required extra that moves into a flow is required only for people who pick that flow.
- Attendee exports include the flow name when one was stored.
- With `price_by_flow` false, money is unchanged.
- With `price_by_flow` true, each path has its own amount. One flow and the switch on means everyone pays that flow’s price, with no path question.

## Tests

- Resolver: zero flows shows every extra; one flow shows shared then that flow and does not ask; two flows hide the other flow’s fields.
- Validator: two flows without `flowId` fails; a required field on the other flow is not required; a required field on the chosen flow is required; a value for another flow’s field is rejected.
- Admin action: signed-out caller is denied; creating a flow and assigning a field persists `flow_id`.
- Seat price: `price_by_flow` false uses residency; true uses the chosen flow’s price, including 0; an active package blocks turning the switch on.

## Manual QA (user)

- One flow: public form has no path question and shows shared fields plus that flow.
- Three flows: pick one and confirm the other paths’ questions are absent; submit succeeds without filling them.
- Move an extra from shared into a flow and confirm only that path sees it.
- Leave the price switch off and confirm both paths pay the residency price. Turn it on, set three amounts, and confirm the total matches the path chosen.
