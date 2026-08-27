# Parent monthly pay: this section vs all payable sections

**Date:** 2026-08-26  
**Status:** Approved (brainstorm)  
**Kind:** Design spec. Implementation plan after this file is reviewed.  
**Related:**
- [`docs/adr/2026-06-tuition-deferred-payment-creation.md`](../../adr/2026-06-tuition-deferred-payment-creation.md) — deferred `payments` rows; gateway maps to a slot
- [`docs/adr/2026-04-section-fee-plans-and-monthly-strip.md`](../../adr/2026-04-section-fee-plans-and-monthly-strip.md) — one row per `(student, section, month, year)`
- [`2026-08-07-parent-portal-student-section-focus-design.md`](2026-08-07-parent-portal-student-section-focus-design.md) — URL `studentId` / `sectionId` on the parent shell

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `30-harness-self-contained-tests.mdc`.

**ADR:** yes — short ADR for the bundle checkout mapping (new tables + `tuition-bundle:` reference). No change to the unique index on `payments`.

## Intent

When a tutor opens a payable month for a ward, they choose **this section** or **every payable section of that child in that month**, see a review screen of the exact lines and total, can go back, and pay **once** (one receipt or one Flow / Mercado Pago checkout). Exempt months and 100% scholarships never appear as payable.

## Decisions

| Topic | Choice |
|-------|--------|
| Who | Parent portal only. Student payments stay one-section-inline. |
| Charge | One checkout / one receipt. Server still writes **one `payments` row per section**. |
| Review | Dedicated route, not a modal. Back returns to the payments strip with the same focus. |
| Scope default | `current` (the section they opened). |
| Scope control | Shown only when that month has **2+ payable** sections (same currency as the origin). |
| Payable set | Server recomputes. Stale totals are rejected, not silently rewritten. |
| Enrollment fee | Out of scope. Matrícula stays on the strip. |
| Mixed currencies | “All” includes only sections whose cell currency matches the origin section. |
| Default if only one payable | No radio. Review lists that one line. No bundle table row. |

## Payable (must match UI and server)

A section-month is **payable** when all of these hold:

1. Cell status is `due` or `rejected` (not `approved`, `pending` with a receipt, `exempt`, `no-plan`, `out-of-period`).
2. Effective amount the parent would pay is **> 0**. `fullMonthExpectedAmount` when the parent strip uses mes-completo; otherwise `expectedAmount`. Zero or null is not payable (covers exemption and 100% scholarship; those cells are already `exempt` in `buildStudentMonthlyPaymentsRow`).
3. Advance-month rule: if the cell is after the calendar month, `allowAdvanceMonthlyPayment` on that section is true.
4. Same ISO currency as the **origin** section’s cell (when building the “all” set).
5. Active enrollment and an effective fee plan (same checks as `validateStudentSectionMonthlySlot`).

`pending` with a receipt already in review is **not** payable. `rejected` is payable (re-upload / new checkout).

## UX

### From the strip

On the parent monthly strip (desktop and PWA), opening a **payable** month does **not** show transfer / Flow / Mercado Pago on the focus card. It shows a primary action that goes to review.

Origin query (all required):

- `studentId`
- `sectionId` (section they were looking at)
- `month`, `year`
- `scope` optional: `current` \| `all` (default `current`)

Route: `/{locale}/dashboard/parent/payments/review`.

Preserve existing parent focus params (`studentId`, and `sectionId` for the shell) via `withParentFocusHref`.

### Review screen

1. Title: period (month + year) and ward display name.
2. If 2+ payable sections: radio **this section** / **all payable this month**. Changing the radio updates `scope` in the URL and the list/total.
3. Line list: section name, optional scholarship % when `0 < percent < 100`, amount. Then **total**.
4. Back: link to `/{locale}/dashboard/parent/payments` with the same `studentId` / `sectionId`. No `payments` rows, no Flow reservation.
5. Pay block: existing tutor method tabs (transfer instructions + one receipt, and enabled online gateways). Amounts shown are the review total.

If the origin section is not payable and `scope=current`, show empty copy and Back. Do not invent a different default section.

If `scope=all` and after filtering only one line remains, still show that one line; do not show the radio.

Enrollment-fee chips and history tab are not on this page.

## Data and checkout

### Helper

Pure (or view-in → list-out) helper, name indicative: `listPayableParentMonthSections`.

Input: monthly view (or equivalent cells), origin `sectionId`, `month`, `year`, `scope`.  
Output: ordered line items `{ sectionId, sectionName, amount, currency, scholarshipDiscountPercent }` and `total`. Empty if origin is missing or not payable under `current`.

Used by the review RSC and by confirm actions (actions reload live view / re-validate slots; they do not trust the client list).

### Confirm snapshot

Actions send `studentId`, origin `sectionId`, `month`, `year`, `scope`, and the **total** shown. Server recomputes the payable set and total.

- Same section ids and same total (currency match rules as `amountsMatchForCurrency`) → proceed.
- Otherwise → user-facing error: amounts changed, go back to review. No upload, no gateway redirect.

### One section

If the accepted set has length 1, call the existing single-slot paths (`submitTutorPaymentReceipt`, `startTutorFlowMonthlyPayment`, `startTutorMercadoPagoMonthlyPayment`). No bundle row.

### Several sections — transfer

One file upload. For each accepted section, `resolveStudentPaymentSlot` (or a shared loop) materializes/updates the `pending` row and sets the **same** `receipt_url` path, `parent_id`, and that section’s effective amount. v1 sends the existing per-slot pending-receipt mail once per section (no new email template).

### Several sections — online

New persisted **bundle** (service-role / existing checkout-ref pattern, not client-writable):

- `payment_monthly_checkout_bundles`: `id`, `student_id`, `parent_id`, `year`, `month`, `currency`, `expected_total`, `section_ids` (uuid[] of ≥ 2 distinct ids), `created_at`.
- `payment_flow_checkout_refs` gains nullable `bundle_id`. Target check becomes: `payment_id` XOR complete single slot XOR `bundle_id`. One `commerce_ref` still maps to one target.
- Mercado Pago `external_reference`: `tuition-bundle:<bundleUuid>`. Extend `parseMonthlyGatewayReference` with `{ kind: "bundle", bundleId }`. Existing `tuition:…` and bare payment UUID keep working.

Checkout start: validate every slot, sum effective amounts, persist bundle, charge **the sum**. Flow optional JSON: student + period + “N secciones” (no ids). Abandoned checkouts still create **no** `payments` rows (same deferred rule as today).

Finalize: load bundle items; sum of **current** plan amounts must match the gateway charge (same currency helper). Then, for each section, `upsertApprovedMonthlyPaymentCore` with **that section’s** plan amount as the row amount — **not** the gateway total. Do **not** send the gateway total into the existing single-slot amount-match (it would skip every line).

At finalize, recompute plan amounts for the bundle’s `section_ids`. If that sum equals the captured gateway amount (currency helper), approve **every** line with that line’s plan amount. If the sum does not match (a line became exempt, already approved, or drifted), materialize **no** rows and log the same class of skip as today’s `amount_mismatch`. Do not approve a partial subset. Finance reconciles the captured charge; do not invent an unallocated leftover `payments` row.

### Return pages

Flow / MP return URLs stay on the parent dashboard. After a bundle pay they land on the existing return pages; back link remains parent payments.

## i18n

New keys under `dashboard.parent.paymentsReview` (indicative): title, lead, back, scopeThis, scopeAll, scopeLegend, lineScholarship, total, continuePay (strip CTA), emptyOrigin, staleSnapshot, periodLabel.

Add the same shape to `en.json`, `es.json`, and `pt.json`. No hardcoded UI copy.

## Out of scope

- Student portal review / bundle.
- Paying enrollment fees in the same checkout.
- Paying more than one calendar month in one checkout.
- Paying several children in one checkout.
- Per-line checkboxes on review (scope is only current vs all payable).
- New parent tutorial for the review route (`parent-pay-or-upload-receipt` stays on the strip).
- Admin collections / record-without-receipt changes.

## Tests

Self-contained unit tests, no live network:

1. `listPayableParentMonthSections`: drops exempt, 100% scholarship / zero amount, pending+receipt, approved, no-plan, out-of-period, future blocked, other currency; keeps `due` and `rejected`; `current` is only origin; `all` is origin plus other payable.
2. Review UI: radio hidden when one payable; radio + total when two; Back href keeps `studentId`.
3. Confirm: stale total rejected; length-1 uses single-slot (mock); length-2 receipt attaches one path to two slots.
4. `parseMonthlyGatewayReference`: `tuition-bundle:<uuid>` and legacy `tuition:` / payment UUID.
5. Bundle finalize helper: sum match approves two rows with per-section amounts; gateway total ≠ sum → no rows.

Existing parent payment and Flow/MP monthly tests stay green (single-section path unchanged).

## Components (indicative)

| Unit | Role |
|------|------|
| `listPayableParentMonthSections` | Payable set + total |
| `ParentMonthlyPaymentReviewScreen` | Review RSC/client: scope, lines, total, methods, Back |
| Parent strip CTA | Replaces inline pay methods on parent focus only |
| `submitTutorMonthlyBundleReceipt` | Multi-slot transfer (or extend existing action when `scope=all` and N>1) |
| `start*MonthlyBundlePayment` | Multi-slot gateway start |
| `finalizeMonthlyPaymentBundle` | Gateway confirm → N approved rows |
| `parseMonthlyGatewayReference` | Add `bundle` kind |

Keep files under the 250-line ceiling; do not grow `StudentMonthlyPaymentFocus` with bundle UI — parent CTA + review screen own it.
