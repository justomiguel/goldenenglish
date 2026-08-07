# Critical E2E — Phase 4a (create-section + users import)

**Date:** 2026-07-12  
**Parent:** [critical-e2e-suite-design.md](./2026-07-12-critical-e2e-suite-design.md)  
**Status:** Approved (user “sigamos agregando”)

## Understanding

- Precommit suite already covers auth, academic smoke, registration, receipt upload/approve, create-user, free event.
- Next high-value, precommit-safe slices: **full create-section UI** (beyond `data-tour` smoke) and **admin users import** (live `ImportUsers` path — not the unmounted long-job `ImportStudents`).

## Intent

Add two Playwright projects under the fail-closed precommit gate without live gateways or KV.

## Done when

1. **Create section (admin):** open cohort → New section → name + teacher + one schedule slot → Create → land on section detail with unique name visible.
2. **Users import (admin):** `/dashboard/admin/users/import` → upload 1-row CSV/xlsx with unique email → dry-run confirm → apply → success notice; optional assert new user appears or result counts.
3. Both wired in `playwright.config.ts` + green under `npm run test:e2e:precommit`.
4. Unique suffixes so re-runs do not collide.

## Out of scope

- Remounting `ImportStudents` / KV long-job / SSE.
- Live MP/Flow.
- Paid-event bank-transfer (Phase 4b).
- Parent receipt upload.

## Risks

| Risk | Mitigation |
|------|------------|
| Create-section validation / schedule fields | Reuse tour `data-tour` + stable `#ns-*` ids from product |
| ImportUsers modal copy / file parse | Tiny CSV fixture; assert dictionary-backed success title |
| Suite time | Keep both under ~60s warm each; workers=1 |

## Definition of done

- Specs + fixtures + config; precommit green; no product changes unless a real bug blocks the path.
