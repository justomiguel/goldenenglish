# Critical E2E — Phase 4b (paid event transfer + parent receipt)

**Date:** 2026-07-12  
**Parent:** [critical-e2e-suite-design.md](./2026-07-12-critical-e2e-suite-design.md)  
**Status:** Approved (user “con los dos”)

## Intent

Extend the fail-closed precommit suite with:

1. **Paid public event** — bank-transfer + receipt upload (no MP/Flow).
2. **Parent receipt upload** — parent pays for ward → admin approve → settled signal.

## Done when

1. Seed `e2e-paid-event` (price &gt; 0, published, bank-transfer path available) + translations; stack-up / reseed idempotent.
2. Playwright: anon registers on paid event, selects bank transfer if needed, uploads `receipt-tiny.png`, sees thank-you dialog.
3. Playwright: parent (storageState) uploads receipt for seeded student due month; admin approves; parent or student sees settled/receipt signal.
4. Both wired in `playwright.config.ts`; `npm run test:e2e:precommit` green within suite budget (~≤4 min warm).

## Out of scope

- Live Mercado Pago / Flow.
- Admin event-payment approve second leg (optional follow-up).
- KV long-job import.

## Risks

| Risk | Mitigation |
|------|------------|
| Event payment UI varies by gateway flags | Seed transfer-only; assert transfer radio / file input |
| Parent payments UI differs from student | Mirror student selectors where shared; adjust for parent copy |
| Shared payment row race with student payments test | Reseed before precommit; unique flows or same seed reset |

## Definition of done

Specs + seed + config; precommit green; Manual QA (user) optional for visual polish only.
