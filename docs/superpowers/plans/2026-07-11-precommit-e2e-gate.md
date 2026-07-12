# Plan: Precommit E2E fail-closed (option A)

**Spec:** `docs/superpowers/specs/2026-07-11-precommit-e2e-gate-design.md`

1. Extend `e2e/env.ts` — `e2eRequireEnabled()`, default E2E port `3100`.
2. `scripts/run-e2e-precommit.mjs` — `SKIP_E2E=1` exit 0; else load `.env.local.e2e`, force isolation, fail-fast, run Playwright.
3. `playwright.config.ts` — `webServer` on port 3100 when `E2E_REQUIRE=1`.
4. `auth.setup.ts` — throw when `E2E_REQUIRE` and isolation fails (no skip).
5. Wire `precommit` → `node scripts/run-e2e-precommit.mjs`.
6. Cursor rule `34-precommit-e2e.mdc` + runbook / AGENTS / `.env.example` / rule 33 gate row.
7. Vitest: require-mode behavior + dotenv load helper if extracted.
