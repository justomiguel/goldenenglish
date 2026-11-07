# Cash payments implementation plan

Spec: `docs/superpowers/specs/2026-11-06-cash-payments-design.md`
Approved: 2026-11-06

## Files

- `src/lib/billing/paymentMethod.ts` — method list, Zod schema, `parsePaidOn`, label formatter.
- `supabase/migrations/267_payment_method_cash.sql` — columns + RPC fields.
- `src/app/[locale]/dashboard/admin/registrations/recordRegistrationFeePaymentAction.ts` — inbox action.
- `src/lib/register/finalizeAcceptedRegistrationLead.ts` — writes fee columns and audits.
- `src/lib/billing/recordPaymentWithoutReceiptCore.ts` — method and date on monthly rows.
- `src/components/molecules/StaffPaymentCaptureFields.tsx` — shared method, date, and amount fields.
- Inbox, enrollment mark-paid modal, monthly confirm form, finance cell modal.
- Family monthly cell and enrollment line show the method.

## Tasks

1. Pure module and tests.
2. Migration, migration test, `masterdb.sql` append, ADR.
3. Inbox kind `collect`, record-payment action, finalize columns.
4. Enrollment mark-paid modal and clear path.
5. Monthly record, revert, receipt approval (`transfer`), gateway (`gateway`).
6. Display on family Web and PWA.
7. Dictionaries (en, es, pt) and changelog.
8. Apply the migration with `sql:apply-migration:all-tenants:pg`.
9. Targeted Vitest, then one commit with spec, plan, and code.

## Surfaces

Tier B admin forms stay desktop-only. Tier A family and student views get a text line on the existing Web summary and the existing PWA enrollment detail. No new controls on the PWA.
