# Event duplicate and discount-code E2E

**Intent:** Add one Playwright spec on the isolated stack. It locks duplicate-as-draft and one discount code through payment approval.

**Done when:**

- `e2e/critical-event-duplicate-and-code.spec.ts` has two tests.
- `playwright.config.ts` has a project that matches that file and depends on `setup`.
- The runbook table lists the project.
- Duplicate: admin opens `e2e-paid-event`, clicks Duplicar evento, and lands on a new id. The header shows `(copia)`. The summary shows the draft hint.
- Code: admin adds a unique code (1 use, 10%) on `e2e-paid-event`. An anonymous register applies the code, sees the discounted pay line, and submits a transfer receipt. Admin opens who-used and sees Reservado and Pago pendiente. Admin approves the payment. Who-used then shows Confirmado and Pago aprobado.

**Out of scope:** Excel import, the generator, family discount, waitlist, reject, revert, and every other event admin action. No new migration. No product changelog (test only).

**Plan:** Reuse `gotoIsolated`, the admin storage state, and `e2e/fixtures/receipt-tiny.png`. Keep each code unique so reruns do not collide. Do not delete the seeded event.
