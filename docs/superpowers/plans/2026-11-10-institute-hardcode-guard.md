# Phase 5 — Institute hardcode guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-institute-hardcode-guard-design.md`
**Depends on:** nothing. It runs in report mode with a baseline from day one. Phase 4 shrinks the baseline to zero.

**Goal:** A new tenant slug in shared code fails the commit. Existing hits are frozen in a baseline that can only go down.

**Architecture:** A pure matcher module scans file text and returns hits with a code. A CLI script walks `src/`, compares counts with a committed baseline, and exits 1 on growth. SQL brand data is marked by a header comment instead of a slug regex.

**Tech Stack:** Node ESM scripts, Vitest, `package.json` precommit.

## Global Constraints

- Codes: `slug_comparison`, `slug_table`, `slug_file_name`, `slug_css`, `slug_dictionary`.
- Scanned: `src/**/*.{ts,tsx,css,json}`.
- Allowed: `src/variants/owned/<slug>/**` (that slug only), `src/__tests__/**`, `e2e/**`, `docs/**`, `supabase/**`, `scripts/**`, `public/**`.
- Baseline entries are `{ path, code, slug, count }` with no line numbers. `--update-baseline` only lowers counts.
- `--strict` ignores the baseline.
- SQL marker: first line `-- ge:brand-data <slug>`.
- Rule files in English (rule 00), ASD-STE100 style (rule 41).

## File map

| Action | Path | Responsibility |
|---|---|---|
| Create | `scripts/lib/instituteHardcodeMatcher.mjs` | Pure: `(path, text, slugs) => Hit[]`. |
| Create | `scripts/lib/instituteHardcodeBaseline.mjs` | Pure: compare hits with the baseline, compute a lowered baseline. |
| Create | `scripts/check-institute-hardcode.mjs` | CLI. |
| Create | `scripts/institute-slugs.json` | Known slugs. |
| Create | `scripts/institute-hardcode-baseline.json` | Frozen hits. |
| Modify | `package.json` | Script and precommit step. |
| Modify | `src/lib/tenant/planInstituteMigrationApplies.ts` | `isBrandDataMigration` reads the marker. |
| Modify | Existing brand data SQL files | Prepend the marker line. |
| Create | `.cursor/rules/53-no-institute-hardcode.mdc` | New rule. |
| Modify | Rules 01, 28, 45, 51, `AGENTS.md`, `docs/runbooks/add-new-tenant.md`, `docs/runbooks/exclusive-landing-request.md` | Doc updates. |
| Test | `src/__tests__/scripts/instituteHardcodeMatcher.test.ts`, `src/__tests__/scripts/instituteHardcodeBaseline.test.ts`, `src/__tests__/lib/tenant/planInstituteMigrationApplies.test.ts` | |

## Tasks

### Task 1: Matcher

**Produces:**

```js
/** @typedef {{ path: string, line: number, code: "slug_comparison"|"slug_table"|"slug_file_name"|"slug_css"|"slug_dictionary", slug: string }} Hit */
export function isAllowedPath(path, slug) // boolean
export function matchInstituteHardcode(path, text, slugs) // Hit[]
```

- [ ] Red: `instituteHardcodeMatcher.test.ts`, one fixture string per case:
  - `kind === "nago"`, `case "liora":`, `x !== 'matiss'` give `slug_comparison`.
  - `{ nago: 1 }` and `["mozarthitos"]` give `slug_table`.
  - Path `src/lib/nagoLogo.ts` gives `slug_file_name`.
  - `.liora-hero {` and `var(--mimundo-ink)` give `slug_css`.
  - `"mimundo": {` in `src/dictionaries/es.json` gives `slug_dictionary`.
  - A word that contains a slug (`nagoya`, `golden-ratio`, `goldenHour`) gives no hit. Match on word edges, quote edges, `-`, and `.`.
  - `src/variants/owned/nago/x.tsx` naming `nago` is allowed. The same file naming `liora` gives a hit.
  - `src/__tests__/x.test.ts` is allowed.
- [ ] Green. Keep `golden` in the slug list. Golden is a tenant like the others.

### Task 2: Baseline and CLI

**Produces:**

```js
export function compareWithBaseline(hits, baseline) // { grown: Entry[], shrunk: Entry[] }
export function lowerBaseline(hits, baseline)       // Entry[]; never raises a count
```

- [ ] Red: `instituteHardcodeBaseline.test.ts`.
  - A new path gives `grown`.
  - A higher count gives `grown`.
  - A lower count gives `shrunk`.
  - `lowerBaseline` drops zero entries and refuses to raise a count.
  - Output is sorted by path, code, and slug.
- [ ] Green. Then write the CLI:
  - It walks `src/` with `fs.readdirSync` recursion and reads slugs from `scripts/institute-slugs.json`.
  - When `PULSAR_DATABASE_URL` is set, it also adds slugs from `select slug from platform_tenants`.
  - Flags: `--update-baseline`, `--strict`, `--report`. `--report` prints totals per slug and code and exits 0.
  - On growth it prints `path:line code slug`, then a hint to move the code into `src/variants/owned/<slug>/` or a domain setting (rule 53). It exits 1.
- [ ] Generate the baseline: `node scripts/check-institute-hardcode.mjs --update-baseline --init`. `--init` is allowed only when the file does not exist. Commit it. Write the totals in the commit body.
- [ ] Add `"check:institute-hardcode"` and insert `npm run check:institute-hardcode &&` after `check:supabase-boundaries` in `precommit`.
- [ ] Add a test that reads `scripts/institute-slugs.json` and checks that it contains every slug in `scripts/vercel-targets.json`.

### Task 3: Brand data marker

- [ ] Red: in `planInstituteMigrationApplies.test.ts`:
  - A file whose first line is `-- ge:brand-data matiss` is brand data.
  - A file without the marker whose name contains `nago_seed` is not brand data.
  - Every file in `supabase/migrations/` that the old regex matches now starts with the marker. Keep the old regex only in the test.
- [ ] Green: change `isBrandDataMigration(fileName)` to `isBrandDataMigration(fileName, firstLine)`. Update `planInstituteMigrationApplies` to read the first line. Update callers in `provisionSharedInstituteSchema.ts` and `publishInstitutePublicImages.ts`.
- [ ] Prepend the marker to each matching SQL file. Add the Matiss brand files too (`268_*`, `269_*` when they carry Matiss data). A comment line does not change how the SQL runs. The ledger keys on the file name, so applied rows stay valid. Confirm that in `planInstituteMigrationApplies.ts` before the edit.

### Task 4: Rule and docs

- [ ] Write `.cursor/rules/53-no-institute-hardcode.mdc` (`alwaysApply: true`) with the content outline in spec section 5. Include a bad and a good example.
- [ ] Apply the table in spec section 6 to rules 01, 28, 45, 51, `AGENTS.md`, and the two runbooks. Keep every cross-reference (rule 00).

### Task 5: Gate and commit

- [ ] `npx vitest run src/__tests__/scripts src/__tests__/lib/tenant`.
- [ ] `npm run check:institute-hardcode`. Expect exit 0 with the new baseline.
- [ ] Add a temporary `if (kind === "nago")` line in a scratch file under `src/lib/`. Confirm exit 1. Remove it.
- [ ] No changelog row (tooling only).
- [ ] Commit spec + plan + scripts + baseline + rules. Do not push.

## Self-review

- Spec sections 1–6 map to tasks 1–4.
- Phase 4 calls `npm run check:institute-hardcode -- --update-baseline` after each client and `--strict` at the end.
