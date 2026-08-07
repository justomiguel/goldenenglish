# Admin help — explain all sidebar screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register content-only “Explain this screen” Driver.js tours for every top-level admin sidebar destination (plus profile), reusing the existing FAB + `screenCatalog` machinery.

**Architecture:** Extend `resolveAdminScreenTour` with exact path matches; add pure content-only step builders driven by a shared helper; wire `data-tour` on page shells; dictionary entries under `dashboard.adminHelpScreenTours.*` (en/es/pt). Hub tour stays chrome-and-content.

**Tech Stack:** Next.js App Router, Driver.js via `runDriverTour`, Vitest, dictionaries en/es/pt.

## Global Constraints

- Scope for all new tours: `content-only` (no sidebar/header steps).
- Exact top-level path match; nested routes stay `null`.
- Finance matches path ignoring query string.
- `…/academic/contents` must not resolve as academic hub.
- Copy: teach, 2–4 sentences on conceptual steps (rule 31); en+es+pt together.
- Files ≤250 lines; pure builders without React/Driver imports.
- Rule 33: update `ADMIN_TOUR_ANCHORS`, `listTourRuntimeChecks`, L1 catalog contract; L2 DOM spot-check representative screens (not every shell if fixtures are heavy).
- Profile: mount Help FAB for admin sessions on `/dashboard/profile`.
- Manual QA is user-owned (rule 32).

---

## File map

| File | Responsibility |
|------|----------------|
| `screenCatalog.ts` | All tour ids, metaKeys, path resolve |
| `selectors.ts` | New `data-tour` anchor constants |
| `explainContentOnlyTour.ts` | Shared intro/title/…/closing step builder |
| `screenTourDefs.ts` | Per-tour step key → anchor map |
| `explain*.ts` or defs-driven | Step builders per screen (prefer defs + one builder) |
| `client/startExplainScreenTour.ts` | Dispatch all ids |
| `listTourRuntimeChecks.ts` | Always-visible anchors per screen route |
| Dictionaries en/es/pt | meta + steps + nav buttons |
| Admin page shells / organisms | `data-tour={ADMIN_TOUR_ANCHORS.*}` |
| Profile layout/page | Admin help launcher when admin |
| Tests | catalog, defs, startExplain, contract, runtime checks, spot DOM |

---

## Task 1: Catalog + resolver (TDD)

- [ ] Expand failing tests in `screenCatalog.test.ts` for all inventory paths + disambiguation + finance query + profile.
- [ ] Implement `AdminScreenTourId`, `metaKey`, `resolveAdminScreenTour` (longest-segment / ordered exact matches).
- [ ] Export helpers like `adminUsersPath(locale)` if useful for runtime checks.

## Task 2: Anchors + content-only builder + defs

- [ ] Add all content anchors to `ADMIN_TOUR_ANCHORS`.
- [ ] Implement `buildContentOnlyExplainSteps(copy, defs)` (intro null, closing null, optional flags).
- [ ] `screenTourDefs.ts`: for each tour id, ordered step keys + anchors.
- [ ] Unit tests for one dense tour (finance) and one list tour (users).

## Task 3: Dictionaries (en/es/pt)

- [ ] Add `adminHelpScreenTours.<metaKey>` for every tour (mirror `adminHome` shape: meta, buttons, steps).
- [ ] Update `tourCatalogContract` to assert every `metaKey` from catalog has `meta.title` in all locales.

## Task 4: Runner wiring

- [ ] `startExplainScreenTour` builds steps from defs + dict for any matched id (including home special-case or unify).
- [ ] Tests: each registered id starts without `unhandled_screen_tour_id`; null path still warns.

## Task 5: DOM anchors on screens

- [ ] Wire `data-tour` on users, registrations, events, finance, academic hub, calendar, contents, badges, coupons, promotions, messages, email templates, blog, glossary, analytics, audit, cms, site-setup, settings, profile.
- [ ] Prefer wrapping existing title/toolbar/table roots; reuse existing anchors where present (`academic-new-cohort`).

## Task 6: Runtime matrix + L2 spot checks

- [ ] Extend `listTourRuntimeChecks` with `screen:*` entries (always-visible anchors only).
- [ ] Add L2 DOM tests for 2–3 representative screens (e.g. glossary, academic toolbar+title, cms hub) — not full suite of 20 if mounting is expensive; document which are covered.
- [ ] Inventory L1 still passes (anchors appear in source).

## Task 7: Profile Help FAB

- [ ] When admin session on profile page, render `AdminHelpLauncher` (dict + screen tours) so Explain works.
- [ ] Smoke test or layout wiring verification.

## Task 8: Verification

- [ ] `npx vitest run` on admin-tutorials tests + touched component tests.
- [ ] Manual QA checklist for user (sidebar walk).

---

## Manual QA (user)

1. From each sidebar item, open Help → Explain this screen → confirm content-only steps.
2. Nested route (e.g. user detail): Explain disabled/soon.
3. Hub: still explains chrome.
4. Profile (as admin): Help FAB present and profile tour runs.
