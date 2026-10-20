# Family discount checkbox on event registration

**Intent:** On the public event registration form, a person can check a box to take 10% off the amount they will pay. The institute does not verify the family link at submit time. Staff see who claimed it and review that later by hand.

**Done when:**

- The registration form shows an unchecked checkbox only when the registration total is greater than zero.
- Checking it shows the discounted amount next to the base amount, in the event currency, before submit.
- The server stores `family_discount_claimed = true` on that attendee and charges 90% of the registration total (flow price, ticket package, or residency price, times seats). The client never sends the amount.
- Mercado Pago, Flow, and the bank-transfer amount due all use that discounted total.
- A price of zero stays zero. The checkbox stays hidden.
- CLP and ARS totals round to the nearest whole unit (half up). Any other currency rounds to two decimal places.
- The admin attendee row shows that the person claimed the family discount. The payment row stores the discounted amount.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral Latin American tuteo.

**Out of scope:**

- Proving the person belongs to a family, linking them to a student, or blocking the discount.
- A staff action to remove the discount or charge the difference after the fact.
- A percent other than 10, or a per-event on/off switch.
- Shop, monthly tuition, trial class, or enrollment checkout.

## Decision

The checkbox is a claim, and the claim changes the money collected now. Later manual control is visibility for staff, not a second approval step before payment.

Rejected alternative: store the claim and keep charging the full price until staff approves. That delays the discount the person was promised on the form.

## Amount

Pure helper, no Supabase and no React: given the registration total from `resolveEventRegistrationTotal` and the claim flag, return the amount to charge.

Gateway and transfer paths keep using `loadEventAttendeeGatewayContext`. That loader applies the same helper when the attendee row has the claim, so a tampered client cannot pick a different percent.

## Persistence

Additive column on `public.event_attendees`:

`family_discount_claimed boolean not null default false`

No new RLS. The existing attendee policies stay. The registration server action writes the flag. `supabase/migrations/` plus `masterdb.sql`.

## Surfaces

- Public register form (and the staff preview of that form): checkbox plus the two amounts.
- Admin attendee list: a short badge when the flag is true.
- Product changelog entry when this ships.

## Tests

- Pure helper: 10% off, zero stays zero, unchecked returns the original total, CLP rounds to a whole unit.
- Gateway context: a claimed attendee charges 90% of the seat total.
- Form: checkbox starts unchecked; checking it shows the discounted amount.
