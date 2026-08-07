# Plan: Admin tutorials staleness guards (Phase A + B)

**Spec:** `docs/superpowers/specs/2026-07-11-admin-tutorials-staleness-guards-design.md`  
**Approved:** Phase A (Vitest + rule 33) + Phase B (Playwright scaffold + smokes)

## Steps

1. **Rule** — `.cursor/rules/33-admin-tutorials-contract.mdc`
2. **Pure helper** — `listTourRuntimeChecks.ts` (+ inventory scan helpers)
3. **Vitest** — inventory, catalog/dict/dispatch, runtime-check consistency
4. **Playwright** — `@playwright/test`, config, auth setup (skip without secrets), `@admin-tours` smokes
5. **package.json** — `test:e2e`, `test:e2e:tours`; gitignore `e2e/.auth`
6. **ADR note** — short amendment on existing tutorials ADR
7. **Run** — Vitest for new files; Playwright dry-run (skip path without creds)
