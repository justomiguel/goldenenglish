# Phase 5 — Institute hardcode guard and rule

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 2 (owned variant folders). Starts in report mode after phase 2. Turns blocking at the end of phase 4.

## Understanding

- Shared code must not name a tenant. A precommit check enforces this.
- The check must not block work in progress. A baseline file lists current hits. New hits fail. The baseline can only shrink.
- A new rule states the contract for agents and people.
- SQL brand data gets an explicit marker instead of a slug regex.

## Current state (checked 2026-11-10)

1. The 2026-11-10 scan found 3805 slug hits in 254 product files.
2. `scripts/check-supabase-boundaries.mjs` is the pattern for a repo guard. It runs in `precommit` as `npm run check:supabase-boundaries`.
3. `isBrandDataMigration` in `src/lib/tenant/planInstituteMigrationApplies.ts` uses a regex with slugs (`nago`, `golden`, `liora`, `mimundo`, `mozarthitos`, `espaciozenit`). It omits `matiss`. Rule 45 repeats the same list.

## Decision

### 1. Script `scripts/check-institute-hardcode.mjs`

Detects, in `src/**/*.{ts,tsx,css,json}`:

| Check | Example | Code |
|---|---|---|
| Slug literal compared to a tenant or kind value | `templateKind === "nago"`, `case "liora":`, `kind !== "matiss"` | `slug_comparison` |
| Slug as an object key or array item in shared code | `{ nago: …, liora: … }`, `["mozarthitos"]` | `slug_table` |
| Slug in a file name outside owned folders | `nagoLogo.ts` | `slug_file_name` |
| Slug in a CSS selector or variable | `.nago-landing`, `--liora-ink` | `slug_css` |
| Slug namespace in dictionaries | `landing.mimundo.*` | `slug_dictionary` |

Slug source:

- `scripts/institute-slugs.json` lists the known tenant slugs. The tenant creation flow (`savePulsarTenantAction`) does not write it. A test compares it with the slugs in `TENANTS_CONFIG_JSON` examples and the seed list.
- The check also matches any slug in the Pulsar `platform_tenants` export when `PULSAR_DATABASE_URL` is set. Without it, the JSON list is used.

Allowed paths:

- `src/variants/owned/<slug>/**` for that slug only. A file in `owned/nago/` that names `liora` fails.
- `src/__tests__/**`, `e2e/**`, `docs/**`, `supabase/**`, `scripts/**`.
- `public/**` asset paths.

Output: one line per hit with path, line, code, and slug. Exit code 1 on a new hit.

### 2. Baseline

- `scripts/institute-hardcode-baseline.json` stores hits as `{ path, code, slug, count }`. It does not store line numbers, so edits nearby do not break it.
- A count above the baseline fails. A count below it rewrites the baseline down with `--update-baseline`. The script refuses to raise a count.
- The baseline is committed. Phase 4 commits shrink it. At the end of phase 4 it is empty, and the script runs with `--strict` (no baseline).

### 3. Gate

- `package.json` gets `"check:institute-hardcode": "node scripts/check-institute-hardcode.mjs"`.
- `precommit` runs it after `check:supabase-boundaries`.
- CI runs the same command.

### 4. Brand data marker for SQL

- A brand data migration starts with the line `-- ge:brand-data <slug>`.
- `isBrandDataMigration` reads the marker. It no longer uses a slug regex. A test covers a `matiss` file.
- Existing brand data files get the marker in place. The file bodies do not change, so applied ledgers stay valid. A test checks that every file matching the old regex now has the marker.
- Rule 45 replaces the slug list with the marker.

### 5. Rule `53-no-institute-hardcode.mdc` (always applied)

Content outline:

- Shared code does not name a tenant. Tenant identity is data: theme document, brand layer, `site_settings`.
- Client-only code lives in `src/variants/owned/<slug>/` and declares `owner`.
- Behavior per tenant uses a domain setting with a domain name (`register.extras_pack = family_guide`), not a slug.
- Copy for one client lives in that tenant's document, not in dictionaries.
- SQL brand data uses `-- ge:brand-data <slug>`.
- The guard and its codes. Do not raise the baseline. Do not add a path to the allow list without a spec.
- Bad and good examples.

### 6. Rule and doc updates

| File | Change |
|---|---|
| `28-tenant-register-surface.mdc` | A new tenant gets its `/register` look from tokens and `pages.register` sections. A `Register<Tenant>Surface` file is an owned variant. |
| `51-exclusive-client-themes.mdc` | An exclusive landing is a set of owned variants. Do not add a `SiteThemeKind` per client. |
| `01-design-system.mdc` | Tokens come from the published theme document. `SYSTEM_PROPERTIES_DEFAULTS` is the default token set. Variants read `--ds-*`. |
| `45-institute-migration-apply.mdc` | Brand data detection by marker. |
| `AGENTS.md` | Row for rule 53. |
| `docs/runbooks/add-new-tenant.md` | New tenant: theme document from a starter set, no code. |
| `docs/runbooks/exclusive-landing-request.md` | Bespoke request: owned variants and fixtures. |

## Options considered

| Option | Why rejected |
|---|---|
| ESLint custom rule | Does not cover CSS, JSON, file names. A Node script covers all, like the Supabase guard. |
| Block from day one | 3805 hits would block every commit until phase 4 ends. |
| Rule text only | Rule 20 states that advisory rules alone are not enough. A mechanical gate is needed. |
| Read slugs only from Pulsar | Precommit must run offline. |

## Surfaces (Web vs PWA)

Not applicable. No UI change. Tooling and rules only.

## Plan outline

1. TDD the matcher as a pure module `scripts/lib/instituteHardcodeMatcher.mjs` with fixtures per code and per allowed path.
2. Script, baseline writer, `--strict`.
3. Brand data marker, `isBrandDataMigration` change, marker on existing files.
4. Rule 53 and rule and doc updates.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| False positives on common words | Slugs are distinct words. Match whole tokens only. The `golden` slug matches only in comparisons and keys, not in prose. |
| Someone raises the baseline by hand | The script compares against the last committed baseline in `git show HEAD:` and fails on a raise. |
| Slow precommit | `rg`-style file walk with a precompiled pattern. Target under 2 s. |

## Definition of done

- The matcher has tests for each code, each allowed path, and the cross-owner case.
- `precommit` runs the guard. A new slug comparison in a shared file fails.
- The baseline exists and matches the tree.
- `isBrandDataMigration` uses the marker and covers `matiss`.
- Rule 53 exists. Rules 01, 28, 45, 51, `AGENTS.md`, and both runbooks are updated.
- At the end of phase 4: the baseline is empty and `--strict` is on.

## Out of scope

- Fixing the hits. Phase 4 does that.

## Manual QA (user)

- None. The guard is automated.
