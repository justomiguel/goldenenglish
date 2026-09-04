# Registration join package (matrícula + first month on `/matricula`)

**Date:** 2026-08-31  
**Status:** Approved (brainstorm)  
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-28-registration-enrollment-fee-checkout-design.md`](2026-08-28-registration-enrollment-fee-checkout-design.md) — guest `/matricula/[token]`, snapshot, intake states, gateways. This spec **extends** that page to a join package. It **supersedes** “pay matrícula with no section” (`once_for_all` + empty picker) and “accept is not offered while `awaiting_fee`”.
- [`2026-08-29-join-payment-disposition-design.md`](2026-08-29-join-payment-disposition-design.md) — admin accept still requires `current` / `behind` / `scholarship`. Family self-pay enrols as `current`. After capture, seed the **snapshot month(s)**, not a freshly recomputed “now”.
- [`2026-08-28-trial-class-and-dual-cta-design.md`](2026-08-28-trial-class-and-dual-cta-design.md) — `/unirse` already quotes matrícula + month. This spec shares the remaining-classes month rule and the same package breakdown.
- [`2026-08-07-class-pack-billing-design.md`](2026-08-07-class-pack-billing-design.md) — `billing_mode = class_pack` has no monthly line.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `04-security.mdc`, `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `28-tenant-register-surface.mdc`.

No ADR: no new table, no new `registration_status` / `intake_state` value, no new RLS. `fee_snapshot` JSON grows; `intake_state` meanings stay, copy changes.

## Intent

Public reserve (`/register` and `/i/[token]`) must charge **one** join package — unpaid matrícula **if it exists**, **plus** the first owed month — before the family becomes a student. The confirmation mail and `/matricula` page say that in plain language. If no class remains this month, the month is the **next** billable month. A paid trial (same person) reduces the package. No schedule → no checkout; the admin sees **assign a schedule to send the charge**. Staff can still accept by hand (cash, scholarship, already known).

**Al día** after a successful package pay: matrícula stamped if it was due, and each snapshot tuition month approved. Prior cycle months stay `exempt` (existing seeder).

## Context (today)

- Reserve checkout (`/matricula`) charges **matrícula only**. Paying it enrols. Mail CTA is “Pagar matrícula”.
- No matrícula (`snapshot.total === 0`) → lead stays, admin accepts. Month is never on the public reserve quote.
- Empty section + `once_for_all` can start a matrícula-only checkout (`needs_section` after pay).
- Remaining-classes → next month does not exist. Join month is calendar “now”.
- Trial credit (`applyPaidTrialCredit`) runs on `/unirse`, not on reserve submit.
- Inbox copy is matrícula-centric (`Pendiente de matrícula`, `Falta asignar sección`) without “what the admin should do next” when the blocker is “no schedule, so we cannot quote a month”.
- Admin accept with join disposition already exists and must stay.

## Decisions

| Topic | Choice |
|-------|--------|
| Checkout | One payment. Same `/matricula/[token]`, same Flow / MP / transfer. No second step, no “paid matrícula only” state. |
| Quote | Unpaid matrícula (existing once_for_all / per_section rules) + one monthly line per monthly-billed section. Class-pack: matrícula only. |
| Join month | If at least one remaining class this calendar month (institute TZ, occurrence start ≥ now) → **this** month. If zero → **next** calendar month **only if** that month is inside the section cycle (`starts_on` / `ends_on`, same window as `planJoinBillingMonths`). Else no tuition line. |
| No schedule | No checkout. `intake_state = needs_section`, snapshot `total = 0`. Admin assigns (rebuild + mail) or accepts by hand. |
| Admin | Still accepts with `current` / `behind` / `scholarship`, and can waive. Inbox stays staff work. |
| Trial credit | Same helper as Unirse: enrollment first, then tuition. Reserve looks up unused captured trial credit by student DNI. |
| Snapshot | Frozen at submit-with-section, admin assign, or family section change **before** capture. Pay and seed use the frozen months, not a live recompute. |
| Unirse | Same month helper + same breakdown/CTA language. Convert still enrols as `current`. No admin disposition on `/unirse`. |
| Legacy leads | Snapshots without `kind: "join_package"` read as enrollment-only (no tuition lines). No backfill. |
| Seat hold | Out of scope (unchanged). |

## Package (what is charged)

Pure planner, no I/O. Inputs: requested sections (facts: billing mode, schedule slots, cycle window, effective matrícula, effective monthly amount), already-covered enrollment ids, already-approved month ids, optional trial credit, `now`, institute timezone.

**Enrollment lines** — reuse `buildRegistrationFeeSnapshot` rules (mode, covered sections, empty list ⇒ no enrollment charge on this path).

**Tuition lines** — skip `class_pack`. For each other requested section, pick at most one `{ sectionId, year, month, amount }`:

1. Remaining class this month? Charge current month amount unless that period is already approved.
2. Else if next month is billable on that section, charge next month unless already approved.
3. Else omit.

**Remaining class:** expand `schedule_slots` the same way trial booking / the class calendar does. Count an occurrence if its start datetime ≥ `now` and its calendar date is in the current institute-local month, and it falls on/after `starts_on` and on/before `ends_on` when those exist. Empty or unparseable slots ⇒ zero remaining this month (then the next-month / no-line rule applies).

**Credit** — `applyPaidTrialCredit` on the sums. `total` is the net the gateway must collect.

**Examples** (one monthly section, matrícula 80_000, month 40_000):

- 10 Aug, later August classes exist → matrícula + August = 120_000.
- 29 Aug, last class was 27 Aug, September in cycle → matrícula + September = 120_000.
- No matrícula, August classes remain → August = 40_000.
- Paid trial 15_000 unused → subtract; CTA shows the net.
- Section ends this month and no classes remain → matrícula only (or 0).

Several sections: each has its own month; the mail lists every line. One section can be August and another September.

Existing student: omit enrollment or month lines already paid/waived/approved.

## When checkout exists

| Lead | Checkout | `intake_state` |
|------|----------|----------------|
| ≥1 requested section with open seats, `total > 0` | `/matricula/[token]` | `awaiting_fee` |
| ≥1 section, `total === 0` | None | `none` (admin accepts as `current`) |
| No section | None | `needs_section` (`total` stored as 0) |
| Requested section full at pay time | None | `section_full` |

Submit still rejects a requested section that is already full (no orphan lead). “No estoy seguro” **inserts** a lead; it does not start pay.

This **replaces** the 2026-08-28 rule that `once_for_all` + empty sections can charge matrícula on the public page.

## Capture and enroll

Gateway amount must match frozen `fee_snapshot.total`. Success (or admin-approved transfer of that total):

1. Shared accept core (create/reuse student, enrol requested sections, welcome mail).
2. `applyJoinBillingDisposition` with `current`.
3. Approve **each tuition month in the snapshot** (not “calendar now” if they differ). Stamp matrícula if a fee was due and not already paid/waived.
4. `fee_captured = true`, lead `enrolled` when sections committed.

Idempotent: repeat webhook / double click is a no-op. Seeder failure after enrol → action error; do not tell the family they are al día if months were not written. Retry fills the missing rows.

`fee_captured` + section full (race): no second charge (unchanged). Family picks another open section; accept runs immediately. Do not rebuild a new payable total. Seed the **already paid** snapshot months onto the new enrolment (no surcharge, no in-product refund if the “correct” month would differ).

Admin **assign** (from `needs_section` or `section_full` **before** capture): rebuild live package, persist, `awaiting_fee` if `total > 0` else `none`, email the family the pay link. After capture, assign/pick enrols without a new charge.

Admin **accept / waive** on an unpaid lead: existing disposition UI. Does not require the family to pay.

## Admin inbox

Same filters: Acciones, Esperando pago, Comprobante, Falta sección, Sección llena, Contactados, Clase de prueba.

Row copy (en + es; `pt.json` same keys) must state the **next staff action**:

| Situation | Table label (intent) | Primary staff action |
|-----------|----------------------|----------------------|
| No schedule | Assign a schedule to send the charge | Assign, or accept by hand |
| Schedule, `total > 0`, unpaid | Waiting for payment: {lines} {amount} (e.g. matrícula + August $120.000) | Wait, accept by hand, or waive |
| Transfer uploaded | Join-package receipt in review | Approve (enrol + `current` seed) or reject |
| Schedule filled | Section full — assign another schedule | Assign open section |
| `total === 0` | Ready to enrol | Accept (`current`) |
| Enrolled | Gone from default inbox | — |

`awaiting_fee` means the **package**, not matrícula alone. Home “waiting payment” count is unchanged (still `awaiting_fee`).

Admin “start fee flow” for a full section becomes **start / resend join-package pay** (same token page, rebuilt snapshot when the family or admin picks an open section).

## Family and admin mail

Reuse registry keys. Change defaults and placeholders so the amount block can list **several lines**, not one “matrícula” string.

| Event | Family | Admin |
|-------|--------|-------|
| Submit with section, `total > 0` | Received + line items + **Pay enrollment** (`Pagar ingreso`) + seat-can-run-out | Ficha + “waiting for package {lines} {amount}” |
| Submit without section | Received; we will assign a schedule and then tell you what to pay. **No** pay button | Ficha + “assign a schedule to send the charge” |
| Admin assigned a section | Schedule confirmed; package lines + pay button | Optional; inbox row is enough if we already mailed on assign. Send family mail always. |
| `total === 0` | Received, no button; institute confirms | Ready to enrol |
| Receipt rejected | Could not validate the **join** receipt; same link and frozen total | — |
| Enrolled | Welcome + portal (unchanged) | Already enrolled |
| Receipt uploaded | Existing pending-receipt family note | “Join-package receipt to review” |

CTA label: **Pay enrollment / Pagar ingreso** when both parts exist; **Pay {month}** when only tuition; **Pay matrícula** only when the package is enrollment-only.

Page `/{locale}/matricula/[token]`: title **Enrollment payment / Pago de ingreso**. Show the breakdown (matrícula, month(s), trial credit, total). One gateway/transfer for `total`. `needs_section`: no pay UI — schedule will be assigned. Invalid token: not-found, no ficha. Enrolled: already-in, no pay.

## Unirse

`planTrialConvertQuote` (or a shared planner it calls) uses the same remaining-class month helper. Convert mail and `/unirse` show the same breakdown and CTA rules. Pay or $0 after credit → enrol as `current` with snapshot months. No scholarship path on `/unirse`. No checkout if every selected section lacks cupo (unchanged).

Reserve and Unirse share the planner. They differ only in how the lead starts (form vs attended trial).

## Architecture (units)

Keep each file under the 250-line ceiling. Do not grow `buildRegistrationFeeSnapshot`, `AdminRegistrationAcceptForm`, or `finalizeAcceptedRegistrationLead` with the new write/quote logic.

| Unit | Responsibility |
|------|----------------|
| Remaining-class helper | Pure: slots + cycle + now + TZ → whether this month still has a class. |
| Join-month picker | Pure: remaining? → this month; else next if billable; else none. |
| Join-package planner | Combines enrollment snapshot + tuition lines + trial credit → `JoinPackageSnapshot`. Used by submit, assign, section-change, Unirse. |
| Snapshot parse | `kind === "join_package"` vs legacy enrollment-only. `total` / currency helpers keep working. |
| `/matricula` page + pay block | Render package lines; CTA from kind of lines. |
| Mail amount/pay block | Multi-line HTML from the snapshot. |
| Inbox labels | Next-action copy from intake + snapshot lines. |
| Capture / approve receipt | Accept + seeder `current` on **snapshot** months. |
| Assign section action | Rebuild planner; mail family. |

`fee_snapshot` shape (additive):

```
{
  kind: "join_package",
  mode, currency, total, capturedAt,
  enrollment: { lines: [{ sectionId, sectionName, amount }] },
  tuition: [{ sectionId, sectionName, year, month, amount }],
  trialCreditApplied: number
}
```

Legacy `{ mode, currency, total, lines, capturedAt }` ⇒ treat `lines` as enrollment, `tuition = []`, `trialCreditApplied = 0`.

No migration required if JSONB stays schemaless. Do not add CHECK constraints that reject old snapshots.

## Error handling

- Family or admin mail fails: log; lead still saved (unchanged).
- Assign/rebuild fails: action error; leave previous snapshot.
- Cupo lost between render and start-pay: filled-section view, no redirect (unchanged).
- Amount mismatch on gateway: log, do not enrol (unchanged).
- Seeder fail after enrol: error, retryable, no double charge.
- Invalid token: not-found.
- Class-pack / end of cycle / credit to $0: no checkout; admin enrols.

## Testing

Isolated unit tests; no new Playwright unless an existing registration e2e already covers `/matricula` and is cheap to extend.

- Remaining class: later class this month → this month; last class already started → next month; next month outside cycle → no tuition; `starts_on` in the future this month → this month if a class remains after start; class-pack → no tuition.
- Planner: both lines; tuition only; enrollment only; trial credit; two sections with different months; existing-student omissions; no sections → total 0.
- Submit: no section → `needs_section`, no pay mail CTA; with section and total > 0 → `awaiting_fee` and package CTA.
- Assign: rebuild + family mail; $0 → `none`.
- Capture: enrol + snapshot month approved; August quote paid in September still writes August if that is what was frozen; double webhook no-op.
- Inbox: assign-to-charge vs waiting-for-package copy.
- i18n: new/changed keys in en, es, and pt shape.

## Done when

1. Reserve with cupo and a due package: mail + `/matricula` show matrícula (if any) + the correct month; one payment enrols as al día.
2. Zero remaining classes this month → next billable month on the quote and after seed.
3. No schedule: no checkout; inbox tells the admin to assign a schedule to send the charge; assign emails the package link.
4. No matrícula → month-only package; class-pack → matrícula-only (or $0).
5. Unused paid trial reduces the reserve and Unirse totals the same way.
6. Admin can still accept / waive / scholarship without the family paying.
7. Legacy matrícula-only snapshots still parse and can complete.
8. Isolated tests cover the planner, remaining-class rule, submit/assign intake, and capture seed.

## Out of scope

- Seat hold / waitlist.
- Two-step pay (matrícula then month).
- WhatsApp / SMS instead of email.
- Changing monthly checkout for students already enrolled.
- Backfilling old leads to add a month.
- Auto-refund when captured + full or when the frozen month is “wrong” after a delay.
- Admin disposition UI on `/unirse`.
- New `intake_state` enum values.
