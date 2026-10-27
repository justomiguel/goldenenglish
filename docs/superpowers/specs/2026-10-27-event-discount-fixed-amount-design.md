# Event discount codes — fixed amount

**Intent:** A discount code is a percent off the registration, or a fixed amount off a limited number of tickets. Staff pick one mode per code. The public total shows how many tickets use the new price.

**Done when:**

- Staff choose **Percent** or **Fixed amount** on the event Codes tab. The other fields stay hidden.
- A fixed-amount code stores a money amount and a ticket count. It does not store a percent.
- On the public form, the covered tickets use `unit price − amount`. Extra tickets stay at the unit price. The total card lists both lines, then the total.
- Percent codes, the family discount, and the use lifecycle stay as they are today.
- Each mode has its own Excel import and its own Excel export. An export includes two example rows. Import skips those rows.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral Latin American tuteo.

**Out of scope:**

- Stacking a code with the family discount.
- A different price per seat. Every ticket in one registration still shares one unit price.
- Tuition coupons.
- One code shared by many events.
- Editing the text of a code that already exists.

## Decision

Keep one code row per event. Add a fixed-amount mode beside the percent. Do not add a second codes table.

The registration total is computed in one pure function. The total card and `enroll_event_attendee_with_discount` call that function. Preview only returns the stored rule. The browser never sends the charged amount.

Rejected alternative: put `amount` and `tickets` on the percent Excel. Staff asked for a second file so the two modes do not share columns.

The implementation writes `docs/adr/2026-10-27-event-discount-fixed-amount.md`. Rule `10-engineering-governance.mdc` requires that ADR because this changes the price contract and the code table.

## Price rule

The unit price is the price of one ticket before the code. It is the flow price, the residency price, or the package price already used for that registration.

`covered = min(seats, ticketCount)`.

`newUnit = max(0, unitPrice − amount)`, rounded like the percent code. CLP and ARS round to the nearest whole unit (half up). Any other currency rounds to two decimal places.

`total = covered × newUnit + (seats − covered) × unitPrice`, then the same rounding.

If the person buys fewer tickets than `ticketCount`, every ticket they buy is covered. The new unit does not go below 0.

A later edit of the code does not change an open payment. The redemption row stores the rule used at enroll.

A total of 0 confirms the attendee and consumes the use at enroll. That matches a 100% code. If any ticket stays above 0, the registration still needs payment.

The family checkbox and a code still clear each other. The server still rejects a payload that sends both.

## Data

Additive migration `supabase/migrations/222_event_discount_fixed_amount.sql`. Update `supabase/migrations/masterdb.sql` in the same change. Do not drop columns.

`public.event_discount_codes`

| Column | Rule |
| --- | --- |
| `discount_percent` | Nullable. Integer from 1 to 100 on a percent code. Null on a fixed-amount code. |
| `discount_amount` | Nullable `NUMERIC(12, 2)`. Null on a percent code. On a fixed-amount code, greater than 0 and at most `99999999.99`. |
| `ticket_count` | Nullable integer. Null on a percent code. On a fixed-amount code, from 1 to 10000. |

Exactly one mode. A percent row has `discount_percent` set and both amount columns null. A fixed-amount row has `discount_percent` null and both amount columns set. Existing rows stay percent rows.

CLP and ARS reject a fractional `discount_amount` on save. Other currencies allow two decimal places.

`public.event_discount_code_redemptions` gets the same three columns and the same one-mode check. The insert copies the code rule. `discount_percent` becomes nullable.

RLS does not change. Anonymous clients still cannot read the code list.

`enroll_event_attendee_with_discount` keeps its arguments. It reads the code row and applies the pure rule to the unit price and the seat count. It still locks the code row and reserves one use per registration. `max_uses` is still how many registrations can use the code. It is not the ticket count.

## Admin Codes tab

Desktop admin. The tab stays `codes`.

A two-option control sits above the fields. The labels are **Percent** and **Fixed amount**. Only one option is selected.

**Percent.** Visible fields: code, uses, percent. Import and export use the percent file. The generator uses the percent and the uses already on screen.

**Fixed amount.** Visible fields: code, uses, amount, tickets. A hint states that the amount comes off each covered ticket, and that extra tickets pay full price. Uses stay “N or an integer ≥ 1”. Tickets are a different field. Import and export use the amount file. The generator uses the amount, the ticket count, and the uses already on screen.

The list column for the discount shows `10%` or the money amount plus the ticket count. Uses, reserved, and confirmed stay as they are.

Add and Excel update an existing code on that event, including a change of mode. They do not change the code text. Delete rules do not change.

Each add, update, delete, import, generate, and export calls `recordSystemAudit`. The payload has the event id, the mode, and at most 20 code ids. It does not include the file.

Revalidate the event admin path after a successful write. The client calls `router.refresh()`.

If the codes tour mentions only the percent field, update that step in the same change.

## Excel

Two files. Headers are English identifiers.

**Percent file.** Columns, in order: `code`, `uses`, `percent`, `example`.

**Amount file.** Columns, in order: `code`, `uses`, `amount`, `tickets`, `example`.

A file from before this change has no `example` column. That file still imports as a percent file.

**Export.** One button per selected mode. The file always starts with the header and these two example rows. Real codes of that mode follow. An empty list still downloads the header and the two examples.

Percent examples:

| code | uses | percent | example |
| --- | --- | --- | --- |
| EJEMPLO10 | 20 | 10 | yes |
| EJEMPLO50 | N | 50 | yes |

Amount examples:

| code | uses | amount | tickets | example |
| --- | --- | --- | --- | --- |
| EJEMPLO2000 | 10 | 2000 | 2 | yes |
| EJEMPLO500 | N | 500 | 1 | yes |

**Import.** The button imports the file for the selected mode. Skip a row when `example` is `yes`, `si`, `sí`, or `exemplo` (any case). Then apply the current row rules: first row wins on a duplicate code, a missing code stays in the database, a cap below occupied uses is a row error, and the other rows still save.

If every data row was an example, save nothing and return `examples_only`.

If the header is the other mode, save nothing and return `wrong_file`. A percent header has `percent` and does not have `amount`. An amount header has `amount` and `tickets`.

The generator download uses the same workbook shape: header, the two examples, then the new codes. Import of that file skips the examples and saves the generated codes.

## Public registration

Web, mobile, and the staff preview share `EventRegisterTotalSummaryCard`.

Apply still sends the code text. The preview returns the rule and does not reserve a use.

- Percent: `{ kind: "percent", percent }`.
- Fixed amount: `{ kind: "amount", discountAmount, ticketCount }`.

The total card recomputes when the seat count changes. Submit still sends the code text. The server computes the amount again.

For a fixed-amount code the card shows, from dictionaries:

- `{{covered}} tickets at {{newPrice}}`
- a second line that the new price is the unit price minus `{{amount}}`
- when extra tickets exist, `{{extra}} tickets at {{unitPrice}}`
- the registration total

The single “you pay” line under the code field stays for a percent code. It does not show for a fixed-amount code, because that line is one price and would hide the split.

Gateway and bank-transfer amounts use this same total.

## Tests

Pure helpers, no Supabase:

- Two covered tickets and one extra ticket produce `2 × newUnit + unitPrice`.
- Fewer seats than `ticketCount` covers every seat.
- Amount greater than the unit price yields a new unit of 0.
- CLP rounds the new unit to a whole number.
- A percent code still discounts the whole subtotal.
- Excel: example rows are skipped, a file of only examples returns `examples_only`, and the other mode’s header returns `wrong_file`.
- An old three-column percent file still parses.

Server behavior, with the database boundary mocked:

- Preview of a fixed-amount code returns the rule and does not insert a redemption.
- Enroll stores `discount_amount` and `ticket_count` on the redemption and charges the pure total.
- A zero total consumes the use at enroll.
- A percent code still stores only `discount_percent`.

Form: after Apply, the total card shows the covered line and the extra line. Changing the seat count updates those lines.

## Manual QA (user)

- Add a fixed-amount code for 2000 off 2 tickets. Export the amount Excel and confirm the two example rows are on top.
- Import that file again. Confirm the example codes are not created.
- Import the amount file with the Percent option selected. Confirm nothing is saved.
- Register 3 tickets with that code. Confirm the total shows 2 tickets at the reduced price and 1 ticket at full price.
- Register 1 ticket with that code. Confirm the one ticket uses the reduced price.
