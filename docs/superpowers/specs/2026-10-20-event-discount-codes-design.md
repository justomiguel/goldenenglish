# Event discount codes

**Intent:** Each event has its own discount codes. Staff load them one by one, from an Excel file, or with a generator. A person can apply one code on the public registration form. The code takes a percentage off the price they would already pay. The code and the family discount do not apply together.

**Done when:**

- Staff open a **Codes** tab on the event detail page.
- The tab lists each code, its percent, its max uses, the reserved count, and the confirmed count.
- Staff can add one code, import an Excel file, or generate up to 200 codes.
- The generator download is an Excel file with the same three columns.
- The public registration form (web and mobile) has a code field next to the family discount. Apply shows the new price. Submit charges the server price.
- A valid code reserves one use at enroll. Payment approval confirms the use. Cancel or payment reject releases the use. A zero amount confirms the use at enroll.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral Latin American tuteo.
- Admin writes record `recordSystemAudit`. The code list is not public.

**Out of scope:**

- Tuition coupons in `discount_coupons`.
- One code shared by many events.
- Stacking the code and the 10% family discount.
- An automatic expiry of a reservation.
- Editing the text of a code that already exists.
- Shop, monthly tuition, trial class, or enrollment checkout.

## Decision

Store the codes on the event. Do not reuse tuition coupons. Do not read the Excel file on each registration.

A reservation is a row. Reserved and confirmed rows occupy a use. A released row does not.

The amount is fixed at enroll. A later edit of the code percent does not change an open payment.

Rejected alternative: reuse `discount_coupons`. Those rows have no event, no reservation, and no per-event Excel import.

The implementation writes `docs/adr/2026-10-20-event-discount-codes.md` with this decision. Rule `10-engineering-governance.mdc` requires that ADR because this adds tables and a public price contract.

## Data

Additive tables. No destructive migration. Update `supabase/migrations/masterdb.sql` in the same change.

`public.event_discount_codes`

| Column | Rule |
| --- | --- |
| `id` | UUID primary key |
| `event_id` | Required. References `events`. Delete the event, delete its codes. |
| `code` | Required text. Unique per event on `lower(trim(code))`. |
| `discount_percent` | Integer from 1 to 100. |
| `max_uses` | Null means no cap (`N`). Otherwise an integer >= 1. The values 1 and 2 are examples, not the only caps. |
| `created_at`, `updated_at` | Timestamps. |

`public.event_discount_code_redemptions`

| Column | Rule |
| --- | --- |
| `id` | UUID primary key |
| `code_id` | Required. On delete restrict. |
| `attendee_id` | Required. One redemption row per attendee. |
| `status` | `reserved`, `consumed`, or `released`. |
| `discount_percent` | The percent used for this registration. |
| `created_at` | Timestamp. |
| `consumed_at`, `released_at` | Null until that change. |

RLS: staff with the existing admin check can read and write codes for the admin UI. Anonymous and public clients cannot select the code list. Registration and payment flows write redemptions on the server.

Occupied uses = rows in `reserved` or `consumed`. The reserve runs in the same database transaction as the attendee insert. Lock the code row first. Two requests cannot take the last use.

## Use lifecycle

1. The person enrolls with a valid code. The server reserves one use and stores the discounted amount on the payment.
2. The payment becomes approved (staff, Mercado Pago, or Flow). The redemption becomes `consumed`.
3. Staff reject the payment, or the attendee is cancelled. A `reserved` redemption becomes `released`.
4. Staff revert an approval. The redemption returns to `reserved`. The use stays occupied.
5. The discounted amount is 0. There is no payment. The attendee is confirmed and the redemption is `consumed` at enroll. A later cancel releases it.
6. A reservation does not expire by time. It stays until cancel or payment reject.

If the payload sets the family discount and a code, the server rejects the enroll. It does not drop one of them.

The percent applies to the registration total that person would pay (flow price, ticket package, or residency price, times seats). Rounding matches the family discount: CLP and ARS round to the nearest whole unit (half up). Any other currency rounds to two decimal places.

Apply on the form does not reserve a use. Only enroll reserves a use. If the last use is taken between apply and submit, submit fails.

## Admin tab

New event detail tab `codes`, after Payments. Desktop admin only. The tab badge count is the number of codes.

The list shows code, percent, max uses, reserved count, and confirmed count. `N` displays as no cap.

**Add one.** Fields: code, percent, uses (`N` or an integer >= 1). If the code already exists on that event, update percent and max uses. Do not change the code text.

**Excel.** Columns, in order: code, uses, percent. Treat the first row as a header only when its uses cell is text other than `N` (for example `uses` or `usos`). `N` is case-insensitive. Any integer >= 1 is a cap.

- The same code twice in one file: keep the first row. Report the later row. Save the other rows.
- A code missing from the file stays in the database.
- If the new cap is lower than occupied uses, do not update that row. Report it. Save the other rows.
- A file with no data rows changes nothing and returns an error.
- An empty code, a percent outside 1–100, or a uses cell that is not `N` or an integer >= 1 is a row error.

**Generator.** Staff choose quantity (1–200), percent, and uses. Each code is 8 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Retry inside the event when a code already exists. Staff can download that batch as Excel with the same three columns.

**Delete.** Allow delete only when occupied uses are 0. The action deletes released redemption rows and the code in one transaction. If any use is reserved or consumed, reject the delete.

Each add, update, delete, import, and generate calls `recordSystemAudit` with the actor, the event id, and a bounded payload. Do not put the full file in the payload. Store saved count, error count, and at most 20 code ids.

Revalidate the event admin path after a successful write. The client calls `router.refresh()`.

The new tab adds a tour anchor and a row in the admin tutorial contract (`33-admin-tutorials-contract.mdc`).

## Public registration

Web and mobile registration, and the staff preview of that form.

- A code field and an Apply control sit next to the family discount.
- Apply calls the server and shows the discounted amount. The server does not reserve a use.
- If the person applies a code, clear the family checkbox. If the person checks the family discount, clear the code and restore the base price.
- Submit sends the code text, not the amount. The server computes the amount.
- Errors, from dictionaries: code not on this event, no free uses, invalid code.
- Gateway and bank-transfer amounts use the same discounted total as the family-discount path.

## Tests

Pure helpers, no Supabase:

- Percent off the registration total, including CLP whole-unit rounding.
- Family claim and code together is a reject, not a stack.
- A 100% code yields 0.
- Excel parse: header, `N`, duplicate code, bad percent, cap below occupied.
- Generator: length 8, allowed alphabet, quantity cap 200.

Server behavior, with the database boundary mocked:

- Enroll reserves a use and stores the discounted amount.
- Enroll fails when occupied uses equal `max_uses`.
- Apply does not insert a redemption.
- Payment approval sets `consumed`.
- Payment reject and attendee cancel set `released`.
- Revert approval sets `reserved` again.
- A zero amount consumes the use at enroll.
- Delete fails when a use is occupied.

Form: Apply shows the new price. The family checkbox and the code field clear each other.

## Manual QA (user)

- Import a three-column Excel on one event. Confirm a second event does not see those codes.
- Apply a code on the public form. Confirm the family checkbox clears and the price drops.
- Submit two registrations against a one-use code. Only the first reserves it.
- Approve the first payment. Confirm the use. Reject a different payment and confirm that use returns.
