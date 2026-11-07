# Cash payments for the enrollment fee and monthly fees — design

Status: draft (awaiting approval)
Date: 2026-11-06

## Context

Staff take cash at the desk. The product has no "paid in cash" record.

- **Pre-registration inbox.** A lead in `awaiting_fee` shows only **Waive** (`registrationInboxPrimaryKind` → `"waive"`). Staff use Waive for cash. That sets `enrollment_fee_exempt = true`. The student then looks exempt, the amount is lost, and collections reports do not count it.
- **Student billing tab.** `markEnrollmentFeePaidNow` writes only `last_enrollment_paid_at`. It stores no amount, no method, and no finance audit.
- **Monthly fees.** `recordPaymentWithoutReceipt` / `recordPaymentsWithoutReceiptBulk` (`recordPaymentWithoutReceiptCore.ts`) set `payments.status = 'approved'` with the plan amount and a note. They have a finance audit (`19-finance-staff-payment-audit.mdc`). They store no method and no paid date.

## Decision

Add a **payment method** and a **paid date** to every staff-recorded payment. Add a **Record cash payment** action to the pre-registration inbox. Use one method list for the enrollment fee and the monthly fee.

## Options considered

1. **Keep Waive + a note.** Rejected. An exempt student and a paying student look the same. Reports are wrong.
2. **New `cash_movements` ledger table (cash register).** Rejected for now. It is a larger product (daily close, cash drawer). It can read the new columns later.
3. **Columns on the existing rows (chosen).** `payments` and `section_enrollments` already hold the paid state. Two nullable columns on each keep one source of truth.

## Data model (migration `267_payment_method_cash.sql`, additive)

`public.payments`:

- `payment_method TEXT NULL CHECK (payment_method IN ('cash','transfer','card','gateway','other'))`
- `paid_on DATE NULL`

`public.section_enrollments`:

- `enrollment_fee_paid_method TEXT NULL` (same check)
- `enrollment_fee_paid_amount NUMERIC(12,2) NULL CHECK (>= 0)`
- `enrollment_fee_paid_on DATE NULL`

Rules:

- Existing rows stay `NULL` (= "not recorded"). No backfill.
- Gateway capture (`applyEnrollmentGatewayCapture`, MercadoPago finalize) writes `gateway`.
- Receipt approval writes `transfer`.
- Staff manual paths write the method that staff choose. The default is `cash`.
- RLS does not change. Staff write through the existing admin paths. Families read their own rows as today.
- Update `masterdb.sql`.
- Refresh `admin_cohort_collections_bulk` so it returns the new enrollment columns. This is a new RPC version in the same migration.

ADR: `docs/adr/2026-11-payment-method-on-staff-payments.md` (data contract, `10-engineering-governance.mdc`).

## Pure module

`src/lib/billing/paymentMethod.ts`:

- `PAYMENT_METHODS`, `PaymentMethod` type, `paymentMethodSchema` (Zod).
- `parsePaidOn(raw, today)`: a valid ISO date, not in the future, at most 366 days in the past. Otherwise `null`.

## Flows

### 1. Pre-registration inbox — Record cash payment

- `registrationInboxPrimaryKind` gains `"collect"`. It returns `"collect"` for `awaiting_fee` with `snapshotTotal > 0`. The panel then shows two paths: **Record payment** (primary) and **Waive** (secondary).
- `receipt_pending` keeps Approve / Reject. It also shows **Record payment** for the case where the family pays at the desk.
- Form fields:
  - method (default `cash`)
  - amount (default `fee_snapshot.total`, editable)
  - paid date (default today)
  - optional note
  - the existing join billing disposition
- New server action `recordRegistrationFeePaymentAction` in `registrationIntakeActions.ts`:
  1. `requireRegistrationIntakeAdmin`.
  2. The lead must be `awaiting_fee` or `receipt_pending`.
  3. Set `fee_captured = true`.
  4. Call `acceptRegistrationLead` with `paidCapture: true` and the new `feePayment: { method, amount, paidOn }`.
  5. `finalizeAcceptedRegistrationLead` writes the three `enrollment_fee_paid_*` columns on the committed enrollments next to `last_enrollment_paid_at`.
  6. Audit: `auditFinanceAction` (domain `billing_finance`, resource = the enrollment) plus `recordSystemAudit` `registration_fee_payment_recorded` with `{ method, amount }`.
  7. `revalidateRegistrationInbox` plus the client `router.refresh()` (the existing `onDone`).
- If the lead has no section yet (admin-assign mode), assign first. The lead returns to `awaiting_fee` and the action appears.

### 2. Student billing tab — enrollment fee "Mark paid"

- `markEnrollmentFeePaidNow` takes `{ method, amount, paidOn, note }`. The UI opens a small `Modal` with the same fields. The defaults are `cash`, the section fee, and today.
- It writes the new columns with `last_enrollment_paid_at`.
- It adds `auditFinanceAction`. A failed audit reverts the write (same contract as `recordOnePaymentWithoutReceipt`).
- `clearEnrollmentFeeManualPaidAt` also clears the three new columns.

### 3. Monthly fees — record without receipt

- `recordPaymentSingleSchema` / `recordPaymentBulkSchema` add `paymentMethod` (default `cash`) and `paidOn` (default today).
- `recordOnePaymentWithoutReceipt` writes `payment_method` and `paid_on`. The audit `afterValues` include both.
- `AdminRecordPaymentBulkConfirmForm` (student billing matrix) and the finance cell bar (`runSectionCellBulkAction`, "Mark paid") show a method select and a date field.
- Revert (mark unpaid) clears both columns.
- Payment review (`reviewPayment` approve with a receipt) writes `transfer` and `paid_on = today`.

### 4. Display

- Admin matrices (student billing and finance section collections): the cell tooltip and the detail add "Cash · 12/03/2026". Method labels come from dictionaries.
- Family and student payment lists: a paid row shows the method when it is set ("Paid in cash"). No new control.

## Surfaces (Web vs PWA)

- Inbox, student billing tab, and finance collections: **Tier B — desktop-only (no PWA tree)**. The new modal and fields use the existing `Modal`, `Input`, and `Button` with Lucide icons.
- Family and student payment views (Tier A): Web (`MonthlyPaymentsSectionAccordion`) and the PWA rows both receive one optional `paymentMethod` field on the row type. Each tree renders the label as text in its own row layout. Shared hooks and actions keep their current signatures. The new field is optional.

## Copy (en / es / pt)

- `billing.paymentMethod.{cash,transfer,card,gateway,other}`
- `billing.paidOnLabel`, `billing.paymentMethodLabel`, `billing.paidWithMethod` ("Paid {method} · {date}")
- `admin.registrations.intake.recordPayment`, `recordPaymentHint`, `recordPaymentAmount`, `recordPaymentAmountInvalid`
- Spanish: neutral tuteo ("Registra el pago", "Pagó en efectivo").

## Observability

- Finance audits as above (`19-finance-staff-payment-audit.mdc`), with `payment_method` in the metadata.
- `[ge:server]` logs with scopes `recordRegistrationFeePayment:*` and `markEnrollmentFeePaid:*`.

## Tests

- `paymentMethod.test.ts`: schema and `parsePaidOn` edges (future date, too old, invalid).
- `registrationInboxPrimaryKind.test.ts`: the `"collect"` kind.
- `recordRegistrationFeePaymentAction` test: wrong state → `not_found`; success → accept called with `feePayment`; audit called.
- `finalizeAcceptedRegistrationLead` test: the enrollment columns are written.
- `recordPaymentWithoutReceiptCore` tests: method and date are written; revert clears them.
- `enrollmentFeeActions` test: mark paid writes the columns; an audit failure reverts the write.
- Migration text test (`src/__tests__/db/payment_method_cash_migration.test.ts`): additive only, `CHECK` lists, no `DROP`.
- Component tests: inbox collect form (defaults, validation), mark-paid modal, and the bulk confirm method select.

## Done when

- Staff can record a cash (or other method) enrollment fee from the pre-registration inbox. The student is accepted as **paid**, not exempt.
- The student billing "Mark paid" and the monthly "record without receipt" paths store the method, the date, and (for the fee) the amount, with a finance audit.
- Admin and family views show the method on paid rows.
- The migration is applied with `npm run sql:apply-migration:all-tenants:pg`.
- The ADR, the changelog entry (`finance`), and the tests ship in the same commit.

## Out of scope

- Cash register / daily close / cash drawer report.
- Internal receipt numbering or a printable cash receipt.
- Backfill of old rows.
- Changing how Waive works (it stays for real exemptions).

## Manual QA (user)

- Inbox: a lead in `awaiting_fee` → Record payment (cash) → the student is created, and the billing tab shows the enrollment fee paid in cash.
- Inbox: a lead in `receipt_pending` → Record payment works without opening the receipt.
- Student billing: mark three months paid in cash → the matrix tooltip shows "Cash · date". Revert clears them.
- Family view (web and installed PWA): paid rows show "Paid in cash".
