# Mini 05 — Finance

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Mini 00

## Intent

Finanzas already has a small icon chip in a bordered header. Replace that chip with `AdminPageHeader` (`iconId="finance"`) so it matches the drawer. Tabs, KPIs, inbox and settings panels stay.

## Done when

- `/admin/finance` header is `AdminPageHeader`; `ADMIN_TOUR_ANCHORS.financeHeader` stays.
- `/admin/payments` if it still has its own `h1`, same header (`finance`).
- `/admin/finance/receipts` and `/admin/finance/receipts/[receiptId]` titles use the kit (receipt detail may omit the large icon).
- No finance tab, loader, or gateway form changes.

## Out of scope

Collections matrix, Flow/Mercado Pago forms, student billing ficha.

## Files

- `src/app/[locale]/dashboard/admin/finance/page.tsx`
- `src/app/[locale]/dashboard/admin/payments/page.tsx`
- `src/app/[locale]/dashboard/admin/finance/receipts/page.tsx`
- `src/app/[locale]/dashboard/admin/finance/receipts/[receiptId]/page.tsx`
