# Phase 8 — Scale budget for 1000 tenants

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phases 1 to 3. Budgets apply to every later phase.

## Understanding

- The design system must work for 1000 tenants with the same response times as for 10.
- Each cost that grows with the tenant count needs a budget, a measurement, and a gate.
- This spec sets the numbers. It does not change the look of any site.

## Current state (checked 2026-11-10)

1. `src/lib/tenant/tenantRegistry.ts` loads tenants from Pulsar `platform_tenants` and falls back to `TENANTS_CONFIG_JSON`.
2. `loadActiveTheme` uses `unstable_cache` with one tag per tenant (`siteThemeActiveCacheTagForTenant`).
3. `manifest.ts` is `force-dynamic` and reads theme data on each request.
4. `npm run sql:apply-migration:all-tenants:pg` applies a file to each tenant in turn and records `institute_migration_ledger`.
5. Visual regression (phase 2) grows with variants × fixtures × viewports.
6. No load test exists for the public site.

## Decision

### 1. Budgets

| Cost | Budget | Measure |
|---|---|---|
| Tenant resolution per request (cache warm) | p95 ≤ 5 ms | Server timing header `ge-tenant` |
| Published theme document read (cache warm) | p95 ≤ 10 ms | Server timing header `ge-theme` |
| Theme document read (cache cold) | p95 ≤ 150 ms | Same header, first request after publish |
| Public home TTFB (cache warm) | p95 ≤ 400 ms on Vercel | Load test |
| Theme document size | ≤ 256 KB | Zod check `document_too_large` |
| Inline `:root` CSS per page | ≤ 6 KB | Unit test on the largest fixture |
| Fonts per page | ≤ 2 families, ≤ 4 files | Unit test on the font resolver |
| JS per landing page | ≤ 170 KB gzip first load | `next build` output check |
| Variant JS per section | ≤ 25 KB gzip | Build output check per variant chunk |
| Migration apply to all tenants | ≤ 30 min for 1000 tenants | Apply command timer |
| Visual regression run | ≤ 10 min in precommit | Playwright timer with the pass cache |
| Fleet report | ≤ 30 s | Script timer, reads the pins table only |

### 2. Tenant resolution

- The host-to-tenant map loads from Pulsar once per server instance and refreshes every 60 s. A new tenant is visible within 60 s.
- A lookup miss triggers one Pulsar query for that host. The miss is cached for 30 s.
- `TENANTS_CONFIG_JSON` stays only for local and E2E targets (rule 19). Production reads Pulsar. Vercel limits the total size of environment variables, so 1000 tenants cannot live in one env value.

### 3. Theme read and cache

- One cache entry per tenant and published version. Key: tenant slug and `published_document_id`.
- Publish revalidates only that tenant tag.
- `manifest.ts` switches from `force-dynamic` to the cached document read.
- Cache entries hold only the published document and the derived CSS string. They do not hold drafts.

### 4. Database connections

- Tenant clients come from `src/lib/supabase/` factories per request. No client is kept per tenant in module memory beyond the existing pattern.
- Shared-schema tenants share one pooled database. A budget of 1000 shared-schema tenants per database is allowed only if the pooler stays under 60% of its connection limit in the load test.

### 5. Migration apply at scale

- The apply command gets `--concurrency <n>` (default 8) and resumes from the ledger after a failure.
- Each target logs its result. A failed target does not stop the others. The command exits 1 if any target failed and prints the failed slugs.

### 6. CI cost

- Visual regression runs only for changed variants plus a fixed smoke set of 10 variants when the pass cache is warm (rule 34).
- Bundle checks run in `next build` on each commit.

### 7. Load test

- Script `scripts/load-test-public.mjs` with Node `fetch` and a concurrency pool. No new dependency.
- Target: the isolated E2E stack seeded with 200 synthetic shared-schema tenants (`supabase/seeds/e2e/`), each with a published document.
- Profile: 50 concurrent requests, random tenant hosts, home and `/register`, 5 minutes.
- Output: p50, p95, p99 per route and the server timing headers. The script fails if a budget fails.
- The user runs it against a Vercel preview before phase 4 ends and before tenant 100 (manual, rule 32).

## Options considered

| Option | Why rejected |
|---|---|
| k6 or Artillery | New tool category. A small Node script covers the need. |
| No budgets, fix when slow | At 1000 tenants a slow path costs every tenant at once. |
| One cache entry for all tenants | One publish would clear every tenant. |

## Surfaces (Web vs PWA)

Not a UI change. Budgets apply to both trees. The JS budget applies to the larger of the web and PWA chunk sets per page.

## Plan outline

1. Server timing headers for tenant and theme reads.
2. Tenant map refresh and miss cache with tests.
3. Cache key per published version. `manifest.ts` on the cached read.
4. Apply command concurrency and resume.
5. Budget checks in unit tests and the build.
6. Synthetic tenant seed and load test script.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Synthetic tenants differ from real ones | Seed them from the 10 starter documents and the largest real document. |
| Concurrency in migrations hits the pooler | Default 8, tunable. Shared-schema targets on one database run one at a time. |
| Budgets block valid work | A budget change needs a spec change with a measurement. |

## Definition of done

- Budget table enforced where a unit or build check exists.
- Server timing headers present on public pages.
- Apply command supports concurrency and resume with tests.
- Load test script runs on the E2E stack and passes the budgets.

## Out of scope

- APM vendor setup.
- Database sharding beyond the current data planes.

## Manual QA (user)

- Run `scripts/load-test-public.mjs` against a Vercel preview and share the output.
