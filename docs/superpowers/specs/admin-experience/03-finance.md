# Mini 03 — Finance bodies

**Parent:** [`../2026-08-22-admin-experience-unification-design.md`](../2026-08-22-admin-experience-unification-design.md)
**Needs:** Mini 00

## Intent

Inbox, collections matrix, receipt detail, and billing panels use the same cards and primary/ghost/error actions as people lists. Hub header and KPI strip already shipped.

## Done when

- Finance inbox rows / bulk bars: no `variant="secondary"` on approve/export; reject stays error.
- Collections matrix toolbar/export: body-card or ghost, not `bg-surface` shells.
- Receipt detail page keeps `AdminPageHeader`; panels are white `rounded-2xl`.
- Remaining billing panels (`AdminRecordPayment*`, scholarship, exemption) use body-card classes.
- `h2` in finance settings stay primary.

## Out of scope

New finance RPCs. Changing matrix math.

## Files (indicative)

- `src/components/dashboard/admin/finance/*`
- `src/components/dashboard/AdminRecordPaymentActionBar.tsx`
- `src/components/dashboard/AdminRecordPaymentRevertBar.tsx`
- `src/app/[locale]/dashboard/admin/finance/receipts/[receiptId]/page.tsx`
