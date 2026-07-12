# Isolated E2E harness + tour staleness (amendment)

**Date:** 2026-07-11  
**Status:** Approved (user requested isolated + scalable full-app E2E)  
**Amends:** `2026-07-11-admin-tutorials-staleness-guards-design.md`  
**Related:** rule `33-admin-tutorials-contract.mdc`, ADR admin-help Driver.js

## Intent

1. Tour staleness checks must **never** require hitting a shared tenant / prod / day-to-day local DB (nago, golden, etc.).
2. Leave a **scalable Playwright harness** so the whole app can grow real E2E later — always against an **isolated** stack.

## Understanding

- Current Phase B logged into whatever `PLAYWRIGHT_BASE_URL` + `E2E_ADMIN_*` pointed at (often the same Supabase as `dev:nago`) — unacceptable.
- Repo has no `supabase/config.toml` local stack yet; full local Supabase is a follow-up ops track, not a blocker for tour isolation today.
- Vitest source inventory already isolates well; “rendered DOM” for tours can be covered with **RTL mounts + fixtures** (no network).

## Decision

| Layer | What | Isolation | When |
|-------|------|-----------|------|
| **L1 — Contract** | Vitest inventory + catalog/dict + `listTourRuntimeChecks` | Pure / filesystem | Precommit |
| **L2 — DOM (tours)** | Vitest RTL: mount toured shells with **mocked props/dict**; assert `data-tour` from `listTourRuntimeChecks` | No Supabase, no HTTP | Precommit |
| **L3 — App E2E** | Playwright against **only** the isolated E2E profile | Dedicated env (`.env.local.e2e` / CI e2e project) | Opt-in; never default to tenant targets |

### L3 isolation rules (scalable for whole app)

1. **Single E2E target name:** `e2e` — env file `.env.local.e2e` (gitignored), documented in `.env.example` + `docs/runbooks/e2e-isolated-harness.md`.
2. **Hard guards** in Playwright config / helper:
   - Require `E2E_STACK=isolated`.
   - Refuse `PLAYWRIGHT_BASE_URL` hostnames matching production / known tenant deploy patterns (configurable allowlist: `localhost`, `127.0.0.1` only for v1).
   - Refuse running if `GE_DEV_TARGET` is set to a product tenant (`nago`, `golden`, …) without `E2E_STACK=isolated`.
3. **Credentials:** `E2E_ADMIN_*` only for the isolated project’s seeded admin — never reuse prod staff emails in docs/examples.
4. **Seed path (documented, implementable later):** SQL/seed or script that creates admin + fixture cohort id for section tours; until seed exists, L3 tour specs **skip** with a clear message (L1+L2 still gate tours).
5. **Structure for growth:**

```
e2e/
  README.md
  env.ts              # isolation guards + env load
  auth.setup.ts       # login only when E2E_STACK=isolated + creds
  fixtures/           # future: seeded ids, storage helpers
  helpers/            # gotoLocale, expectTourAnchor, …
  admin-tours.spec.ts # thin; uses listTourRuntimeChecks
  # future: auth.spec.ts, enrollment.spec.ts, …
docs/runbooks/e2e-isolated-harness.md
```

6. **Tour default gate:** L1 + L2 on precommit. L3 `@admin-tours` is optional until the isolated stack is provisioned; when run without isolation flags → **fail fast** (do not silently hit nago).

### Alternatives rejected

| Option | Why not |
|--------|---------|
| Keep login against `dev:nago` | Hits shared real DB |
| Auth bypass secret in middleware | Security risk if leaked to prod |
| Drop Playwright entirely | Blocks scalable full-app E2E |
| Only MSW without a future real E2E path | Insufficient for full journey confidence later |

## Implementation plan (this change)

1. Amend staleness spec + rule 33: L2 = Vitest DOM; L3 = isolated Playwright only.
2. Add `tourAnchorDomPresence` Vitest tests mapping `listTourRuntimeChecks` → mounted components (mocked).
3. Refactor `e2e/`: `env.ts` guards, README + runbook, auth only under `E2E_STACK=isolated`.
4. Without isolation: `test:e2e*` exits non-zero with message **or** skips all with explicit “not isolated” — prefer **fail** when someone passes tenant URL without flag; **skip** when no E2E env at all (CI without secrets).
5. Remove `.env.example` guidance that implies using day-to-day tenant admins.
6. ADR amendment: isolated E2E profile.

## Definition of done

- [ ] Tour staleness on precommit needs **zero** Supabase / tenant DB.
- [ ] Playwright cannot be “pointed at nago” as the documented path; isolation guards enforced.
- [ ] Runbook explains how to provision `.env.local.e2e` and grow specs for the whole app.
- [ ] L2 DOM tests cover `listTourRuntimeChecks` anchors that are mountable without network.
- [ ] Rule 33 updated.

## Out of scope (follow-up)

- Standing up `supabase start` / dedicated Vercel+Supabase e2e project in this PR (runbook only).
- Full pedagogical Driver click-through in CI.
- Seeding automation script (document contract; optional stub).

## Approval

User asked to make everything isolated and leave a scalable full-app E2E solution — treat as approval to implement this amendment after writing Gate 0 marker to this file.
