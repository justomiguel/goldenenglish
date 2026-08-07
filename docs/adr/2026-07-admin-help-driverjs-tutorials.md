# Admin help launcher + Driver.js guided tutorials

## Context

Admins need in-product walkthroughs (spotlight + dimmed overlay) without a second FAB competing with student search. Tours must respect the design system, i18n dictionaries, and App Router client boundaries.

## Decision

1. Extend the existing admin FAB into a **single launcher** with tabs **Help** | **Search** (`AdminHelpLauncher`).
2. Use **Driver.js** (MIT) for guided tours, loaded via dynamic `import()` only when a tour starts.
3. Keep a pure catalog under `src/lib/admin-tutorials/` and stable `data-tour` anchors on UI targets.
4. First tour: **create-cohort**.

## Alternatives considered

| Option | Why rejected |
|--------|----------------|
| Second FAB for help | Visual clutter next to command palette |
| React Joyride | Larger bundle; opinionated chrome harder to token-align |
| Intro.js | AGPL / commercial licensing unfit for this product |
| Custom overlay | Reinvents focus management and a11y |

## Consequences

- Positive: one discovery affordance; lightweight tour engine; DS-friendly CSS via `.ge-admin-tour-popover`.
- Risk: multi-route tours need waits for anchors after `router.push`; mitigated with `waitForSelector` timeouts and client warn logs.
- Follow-ups: more catalog entries; optional analytics dashboards on `admin_tutorial:*` entities.
- Tests: pure catalog/path/step builders; RTL for launcher tabs; mocked Driver for runner when extended.

## Amendment (2026-07-11) — contextual screen explain

- Help panel leads with **Explain this screen** resolved from `pathname` via `screenCatalog` / `startExplainScreenTour`.
- First screen tour: **admin-home** (chrome + content). Future screen tours are **content-only**.
- Analytics entity prefix: `admin_screen_tour:*` (alongside existing `admin_tutorial:*` task tours).
- Spec: `docs/superpowers/specs/2026-07-11-admin-help-explain-screen-design.md`.

## Amendment (2026-07-11) — explain tours for all sidebar screens

- Content-only explain tours registered for every top-level admin sidebar destination (plus `/dashboard/profile` for admin sessions).
- Hub (`admin-home`) remains the only `chrome-and-content` tour.
- Registry: `screenCatalog` + `screenTourDefs` + `buildContentOnlyExplainSteps`; copy under `dashboard.adminHelpScreenTours.*` (en/es/pt).
- Spec: `docs/superpowers/specs/2026-07-11-admin-help-explain-all-sidebar-screens-design.md`.


- Cursor rule **`33-admin-tutorials-contract.mdc`**: UI changes that touch toured surfaces must update tours + contracts in the same change.
- **L1+L2 (precommit, no DB):** Vitest inventory + RTL DOM presence via `listTourRuntimeChecks()` / `tourAnchorDomPresence`.
- **L3 (opt-in):** Playwright only with `E2E_STACK=isolated` against a dedicated e2e stack — never tenant DBs. Runbook: `docs/runbooks/e2e-isolated-harness.md`.
- Specs: `docs/superpowers/specs/2026-07-11-admin-tutorials-staleness-guards-design.md`, `docs/superpowers/specs/2026-07-11-e2e-isolated-harness-design.md`.
