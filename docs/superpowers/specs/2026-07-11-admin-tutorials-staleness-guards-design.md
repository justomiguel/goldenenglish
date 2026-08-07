# Admin tutorials — staleness guards (design)

**Date:** 2026-07-11  
**Status:** Amended — L2 Vitest DOM (no DB); L3 Playwright only on isolated stack  
**See also:** `2026-07-11-e2e-isolated-harness-design.md`  
**Related:** `31-admin-tutorials-copy.mdc`, ADR `docs/adr/2026-07-admin-help-driverjs-tutorials.md`, specs under `docs/superpowers/specs/2026-07-11-admin-help-*`

## Intent

When someone changes an admin **screen**, **control**, or **flow** that a guided tutorial (task tour or “explain this screen”) depends on, the change must **fail fast in automated tests** (and be required by a Cursor rule) so outdated tours are obvious before merge—not discovered only in Manual QA.

## Resolutions (from product)

| Question | Decision |
|----------|----------|
| Rule placement | **New** `.cursor/rules/33-admin-tutorials-contract.mdc` (copy/UX stays in `31`) |
| Unknown `data-tour` | Fail if any `data-tour="…"` in `src/` is **not** in `ADMIN_TOUR_ANCHORS` (one namespace); declared ⇒ present; builders ⇒ declared |
| Playwright | **In scope as Phase B** (optional CI / nightly); Phase A = Vitest contracts + rule (always on precommit) |

## Understanding

- Tours are driven by stable `data-tour` anchors (`ADMIN_TOUR_ANCHORS`) plus dictionary copy and catalog/dispatcher wiring.
- Today: per-tour unit tests and a few component smokes exist, but there is **no systemic contract** that every declared anchor still exists in UI source, or that catalog/dict/dispatcher stay aligned.
- The repo has **no** `@playwright/test` in root `package.json` yet (only agent skills under `.agents` / `.claude`). Adding Playwright is a deliberate harness upgrade.
- Agents/devs can rename buttons, remove fields, or restructure flows and leave Driver steps pointing at missing selectors.

## Goals

1. **Mechanical breakage (Phase A)** — Vitest contract tests fail when a tour contract drifts (anchors, catalog, i18n keys, dispatcher, step order).
2. **Agent rule** — `33-admin-tutorials-contract.mdc` obligates updating tutorials + those contracts when touching toured surfaces.
3. **Runtime breakage (Phase B)** — Playwright smokes assert that tour anchors **exist in the live DOM** on the routes where tours expect them (catches “in source but not rendered”, wrong route, gated UI).
4. **Fast signal** — failures name the missing anchor / catalog id / locale key / route.

## Non-goals

- Auto-rewriting tour copy via AI when UI changes.
- Student/parent surfaces.
- Replacing Manual QA for full pedagogical walkthroughs (`32` still applies for judgmental UX).
- Agent-driven browser MCP walkthroughs as the gate (Playwright **scripts in CI** are the automation; Manual QA remains user-owned).

## Decision summary

| Layer | Mechanism | Phase |
|-------|-----------|-------|
| Cursor rule | **`33-admin-tutorials-contract.mdc`** — UI change → tour update + contracts | A |
| Anchor + catalog + i18n contracts | Vitest inventory / dispatch / dict / step-order snapshots | A |
| Live DOM anchors | Playwright: login as admin → visit tour routes → `expect(locator('[data-tour=…]')).toBeVisible()` for that tour’s expected anchors | B |
| Optional deep tour | Playwright: start one catalog tour, assert Driver popover appears, advance 1–2 steps (not full create-cohort submit) | B (stretch) |

### Alternatives rejected

| Option | Why not |
|--------|---------|
| Rely only on Manual QA | Too late; contradicts “fail fast” |
| Playwright-only (skip Vitest inventory) | Slow feedback; needs auth + server; misses dict/dispatcher drift |
| Only a Cursor rule without tests | Soft guidance; agents can still ship drift |
| Full click-through create-cohort in CI | Flaky (real cohort create, year branch, modals); keep as Manual QA |

---

## Phase A — Vitest + rule (ship first)

### Architecture

```
src/lib/admin-tutorials/
  selectors.ts          # ADMIN_TOUR_ANCHORS (source of truth for ids)
  catalog.ts / screenCatalog.ts / *Tour.ts / client/start*.ts

src/__tests__/lib/admin-tutorials/
  tourAnchorInventory.test.ts   # anchors ↔ source; no orphan data-tour
  tourCatalogContract.test.ts   # catalog ↔ dispatch ↔ dict keys
  *Tour.test.ts                 # ordered anchor sequences

.cursor/rules/33-admin-tutorials-contract.mdc
```

### Contract details

1. **Anchor inventory** — Every `ADMIN_TOUR_ANCHORS` value appears as `data-tour="…"` under `src/`; every `data-tour` in `src/` is in the map; builders only use mapped anchors. Static string literals only.
2. **Catalog ↔ runner** — Catalog ids handled by `startAdminTutorial`; screen catalog paths resolve as documented.
3. **Dictionary keys** — Required shapes in en/es/pt for catalog + tours + explain-screen.
4. **Step sequence snapshots** — Ordered anchors / branch flags frozen per builder.
5. **Keep** existing RTL smokes for event wiring (e.g. open-new-cohort).

### Cursor rule (`33`) obligations

When a change touches `data-tour` or a toured admin flow, the agent **must** update tour builders/copy/catalog, keep anchors in sync, update Phase A contracts (never delete coverage to silence), and leave `REGRESSION CHECK` notes. Abandoning a target ⇒ remove step + shrink map in the same change. Phase B Playwright specs must be updated when tour routes/anchors change.

---

## Phase B — Playwright (how we would implement it)

### Why Playwright on top of Vitest

| Vitest inventory | Playwright |
|------------------|------------|
| Proves the attribute exists **in source** | Proves the node exists **when the page renders** |
| Instant, no auth | Needs admin session + running app |
| Misses conditional render / wrong route | Catches “anchor only on a branch never reached” if we hit the right setup |
| Precommit-friendly | Better as **CI job / nightly / opt-in script**, not blocking every local commit unless tagged |

Together: source contract + runtime presence.

### Bootstrap (repo today has no Playwright)

1. Add `@playwright/test` as a **devDependency** (single version; no duplicate browser stacks).
2. `npx playwright install chromium` (CI: browser install step).
3. Config: `playwright.config.ts` at repo root — `testDir: e2e/` (or `src/e2e/`), `baseURL` from `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`), `webServer` optional when CI starts `npm run start` after build.
4. Scripts in `package.json`:
   - `test:e2e` — all Playwright
   - `test:e2e:tours` — grep/project tag `@admin-tours`
5. **Do not** fold Playwright into `npm run test:coverage` / default precommit until the team opts in (align with `02` / `990`). Document in rule 33: Phase A is mandatory on precommit; Phase B is CI/nightly or explicit.

### Auth harness

Admin routes need a real session. Prefer:

| Approach | Notes |
|----------|--------|
| **storageState** | One-time (or CI) login → save `e2e/.auth/admin.json`; reuse in projects. Secrets via env (`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`), never committed. |
| **Seeded test user** | Documented tenant + admin fixture (Nago/dev); same storageState pattern. |

Reject: bypassing auth by mocking the entire Next session in Playwright (brittle, doesn’t exercise real layout).

Align with **`04-security`**: credentials only in CI secrets / local `.env.local` (gitignored).

### What each tour smoke asserts (recommended v1)

**Anchor-on-route matrix** (derived from pure tour builders + path helpers—not hand-duplicated selectors):

```
for each tour id:
  navigate to the route where that step’s anchors are expected
  for each non-null anchor in the “visible without user create” subset:
    await expect(page.locator(`[data-tour="${anchor}"]`)).toBeVisible({ timeout })
```

Examples:

| Tour | Setup | Anchors asserted (smoke) |
|------|--------|---------------------------|
| `admin-home` explain | `/[locale]/dashboard/admin` | sidebar, chrome, hub cards present on home |
| `create-cohort` | academic hub | `academic-new-cohort` (and nav if on other page then navigate) |
| `create-section` | cohort detail with sections tab (seeded cohort id via env or fixture) | sections tab, new-section control |
| create-user tours | create-user route | form anchors from `ADMIN_TOUR_ANCHORS` create-user* set |

**Out of Playwright smoke (keep Manual QA):** year-branch popover, real cohort insert, handoff to section tour, full Driver step-through with form fill.

### Optional stretch: Driver popover smoke

1. Open help FAB → start `create-cohort` (or explain screen).  
2. `expect(page.locator('.driver-popover, .ge-admin-tour-popover'))` visible.  
3. Click Next once; assert popover still present or next anchor highlighted.  
4. Dismiss / Escape; assert overlay gone.

Do **not** require completing create in CI.

### Sharing contracts with Vitest (avoid drift)

Export a small pure helper used by both layers, e.g.:

- `listTourRuntimeChecks(): { tourId, path, anchors: AdminTourAnchor[] }[]`

Vitest asserts the helper is consistent with builders; Playwright iterates the same helper. **One source of expected anchors per route.**

### CI placement

| Gate | Runs |
|------|------|
| Precommit / `test:coverage` | Phase A only |
| PR CI (optional job) | Phase B when `E2E_*` secrets present |
| Nightly | Phase B full `@admin-tours` |

Failure message should include `tourId`, `anchor`, and `path`.

### Flake controls

- `data-tour` locators only (no text/CSS class coupling).  
- Bounded timeouts aligned with `waitForSelector` tour timeouts.  
- No parallel dependency on shared mutable cohort names if a deep test is added later.  
- Prefer asserting DOM presence, not Driver animation end.

---

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Inventory misses dynamic anchors | Static literals only; ban runtime-built tour ids |
| Playwright auth/env missing locally | Phase B opt-in; clear skip when secrets absent |
| E2E flake slows merges | Tag `@admin-tours`; nightly first; promote to PR when stable |
| Copy-only drift | Rule 33 + human/agent review; tests don’t replace pedagogy |
| Dual maintenance of expected anchors | Shared `listTourRuntimeChecks` |

## Definition of done

### Phase A (this change set after approval)

- [ ] `.cursor/rules/33-admin-tutorials-contract.mdc` landed.  
- [ ] Vitest inventory + catalog/i18n/dispatch + step-order contracts green in isolation.  
- [ ] Removing/renaming a toured `data-tour` without updating map/tests fails Vitest.  
- [ ] Orphan `data-tour` not in `ADMIN_TOUR_ANCHORS` fails Vitest.  
- [ ] Spec/ADR pointer from rule 33.

### Phase B (same PR or follow-up — confirm scope)

- [ ] `@playwright/test` + config + `test:e2e:tours` script.  
- [ ] Auth storageState pattern documented (env vars, no secrets in git).  
- [ ] At least one smoke per registered tour id asserting key anchors on-route via shared `listTourRuntimeChecks`.  
- [ ] Rule 33 mentions updating Playwright matrix when tours change.

## Out of scope

- Full pedagogical Driver walkthrough of every branch in CI.  
- Non-admin help surfaces.  
- Agent offering unsolicited browser MCP QA (`32`).

## Approval

- Phase B **in this change** (option B): Playwright bootstrap + `@admin-tours` smokes alongside Phase A.
- Approved 2026-07-11.
