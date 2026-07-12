# Critical E2E — Phase 2b / 3b (receipt upload + free event)

**Date:** 2026-07-12  
**Status:** Approved via user “hagamoslo” (extends `2026-07-12-critical-e2e-suite-design.md`)  
**Parent:** `docs/superpowers/specs/2026-07-12-critical-e2e-suite-design.md`

## Intent

Close the remaining **receipt-only money path** and **free event register** on the isolated Playwright stack, still under the precommit budget (~≤4 min warm).

## Done when

1. **Student upload → admin approve → paid**
   - Seeded student has a **due** monthly slot (pending payment **without** `receipt_url`, or equivalent).
   - Student uploads a tiny fixture image/PDF from `/dashboard/student/payments`.
   - Admin finance inbox shows the row; approve with **OK — Pagado**.
   - Student payments UI shows **Paid / approved** for that period.
2. **Free public event register**
   - Seed publishes a zero-price event (`slug` e.g. `e2e-free-event`).
   - Anonymous register on `/{locale}/events/{slug}/register` → success dialog.
3. `npm run test:e2e:precommit` stays green; runbook lists the new fixtures/projects.

## Out of scope

- Live MercadoPago / Flow checkout (nightly / Phase 4).
- Bulk import long-job UI (Phase 4).
- Paid event / transfer receipt for events.
- Parent-side upload (student path is enough for this slice).

## Notes

- Prefer extending `critical-payments.spec.ts` over a third payments project if timing stays under budget.
- New project `chromium-critical-events` for free event register.
- Seed remains local-only (`supabase/seeds/e2e/`).
