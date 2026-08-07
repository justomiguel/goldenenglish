# Precommit: run all Playwright E2E before every commit

**Status:** Approved — option A (fail-closed)  
**Date:** 2026-07-11  
**Related:** `docs/runbooks/e2e-isolated-harness.md`, `docs/superpowers/specs/2026-07-11-e2e-isolated-harness-design.md`

## Intent

Make **all** Playwright E2E (`npm run test:e2e`) a **hard gate before every commit**, documented as a Cursor rule and enforced by Husky/`npm run precommit`, without ever targeting tenant DBs (`nago` / `golden` / prod).

## Understanding

- Today `precommit` = lint + boundaries + verify + build + Vitest coverage. Playwright is **not** in the gate.
- L3 E2E is **opt-in isolated** (`E2E_STACK=isolated`). Without it, auth/tours **skip** → exit 0 (useless as a gate).
- Playwright currently assumes an already-running app at `PLAYWRIGHT_BASE_URL` (no `webServer` in config).

## Decision to confirm (pick one)

### A — Fail-closed (recommended for “must run”)

1. Add `npm run test:e2e` to `precommit` (after unit coverage or before — prefer **after** Vitest so fast failures stay fast).
2. Change isolation policy for the gate: if `E2E_STACK !== isolated` (or missing admin env), **fail the run** instead of skip.
3. Load env from `.env.local.e2e` when present (script wrapper), set `E2E_STACK=isolated` + `GE_DEV_TARGET=e2e`.
4. Add Playwright `webServer` that starts the app with that env (or reuse if `127.0.0.1:3000` already up) so commit does not depend on a manual `dev` terminal.
5. Cursor rule (e.g. `.cursor/rules/34-precommit-e2e.mdc`): agents must not skip this gate; escape hatch only with explicit user `SKIP_E2E=1` (documented).

**Consequence:** Local commits require a provisioned e2e Supabase + `.env.local.e2e`. Without it, commits fail until setup or `SKIP_E2E=1`.

### B — Soft gate (weaker)

- Cursor rule only (agents run e2e when user asks to commit).
- Husky runs e2e **only if** `.env.local.e2e` exists; otherwise prints warn and continues.
- Keeps skip-when-not-isolated.

**Consequence:** Easy to ship without ever running L3.

## Proposed plan (if A)

1. Mini Cursor rule `34-precommit-e2e.mdc` + link from `AGENTS.md` / runbook.
2. `scripts/run-e2e-precommit.mjs` — load `.env.local.e2e`, assert isolation, run `playwright test`; honor `SKIP_E2E=1`.
3. Flip skip → fail when isolation not ok (or only when `E2E_REQUIRE=1` set by the script).
4. `playwright.config.ts` — `webServer` for isolated precommit.
5. Wire `test:e2e` / `precommit` in `package.json`.
6. Unit test for “require vs skip” env helper; update runbook.

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Precommit becomes slow (minutes) | Keep Vitest first; E2E last; document `SKIP_E2E=1` for WIP commits |
| Missing e2e project blocks all commits | Runbook + clear fail message pointing at harness doc |
| Accidental tenant hit | Keep `resolveE2eIsolation()` guards; never load `.env.local` (nago) for e2e |
| Conflict with rule 32 (manual QA user-owned) | Clarify: Playwright **automated** gate ≠ manual browser QA |

## Done when

- [x] Cursor rule exists and is alwaysApply (or commit-scoped).
- [x] `npm run precommit` runs **all** Playwright projects unless `SKIP_E2E=1`.
- [x] Without isolated env, gate **fails** (option A) with actionable message — not silent skip.
- [x] Runbook updated; no tenant DB used.

## Out of scope

- Provisioning the e2e Supabase project itself.
- Expanding tour/spec coverage beyond existing `e2e/`.
- CI matrix / Vercel (local husky only unless asked later).

## Assumption

Default implementation path is **A (fail-closed)** unless you say **B**.
