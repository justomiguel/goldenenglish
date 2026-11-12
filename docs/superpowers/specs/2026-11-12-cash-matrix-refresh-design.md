# Cash mark shows paid on the collections matrix

**Intent:** After staff record a cash payment, the section collections matrix shows that month as paid on the same screen.

**Done when:**

- The section-year payments read returns every row for that section and year. A row past the first 1000 is included.
- A cash insert that lands on a later page makes that month `approved` in the view.
- An update that changes 0 rows is a failure. The action does not report success.
- The matrix calls `router.refresh()` when at least one selected cell was saved.

**Out of scope:** Applying migration `267_payment_method_cash.sql` to live institutes. Cohort overview edits. A new payment method.

## Cause

`loadAdminSectionCollectionsView` reads `payments` in one PostgREST call. Hosted PostgREST returns at most 1000 rows and does not error. The call has no `order` and no `range`. A new cash row can fall outside that page. `router.refresh()` then reloads a view that still shows the month as due.

A second mark finds the row already `approved`, returns failure, and skips refresh. The cell stays due.

`recordOnePaymentWithoutReceipt` treats an update with 0 matched rows as success. The status filter is `pending` or `rejected`. Supabase returns no error when the filter matches nothing.

## Surfaces (Web vs PWA)

Finance collections is Tier B. Desktop only. No PWA tree under `src/components/pwa/` for this matrix.

The payment write is also used by admin student billing. That entry uses `SurfaceMountGate`. This change does not alter billing props, layout, or the PWA tree. Both surfaces read the same payment status.

## Tests

- A payments page of 1000 rows plus one later approved cash row marks that month approved.
- An update that returns no row fails with `save_failed`.
