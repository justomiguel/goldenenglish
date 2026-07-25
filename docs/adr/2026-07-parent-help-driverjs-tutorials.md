# Parent help launcher + Driver.js guided tutorials

## Context

Parents and tutors need in-product walkthroughs on desktop and mobile/PWA without sharing the admin Help FAB. Admin already standardized on Driver.js (`docs/adr/2026-07-admin-help-driverjs-tutorials.md`).

## Decision

1. Ship a **parent-only** Help FAB (`ParentHelpLauncher`) mounted from the parent dashboard layout on both surfaces.
2. Keep a parallel bounded context `src/lib/parent-tutorials/` (catalog, screen registry, surface-tagged steps, selectors).
3. Reuse Driver.js via `runParentDriverTour` (dynamic import); reuse layout-sync helpers from admin client without folding parent into `admin-tutorials`.
4. Analytics entities: `parent_screen_tour:<id>` and `parent_tutorial:<id>`.

## Alternatives considered

| Option | Why rejected |
|--------|----------------|
| Extend `admin-tutorials` with parent role | Contaminates admin globs/rules and catalog |
| Extract multi-role `guided-tours` package in same PR | High refactor risk on existing admin tours |
| React Joyride / Intro.js | Same rejections as admin ADR |

## Consequences

- Positive: Tier A parents get explain + task tours with surface-aware chrome teaching on home only.
- Risk: dual UI trees require optional anchors and L1/L2 contracts; mitigated by `filterStepsForSurface` + optional DOM filter.
- Done in-repo: multi-step `parentHelpTours` copy (en/es/pt); Cursor rules `35`/`36`; L1 catalog + L2 chrome DOM fixtures; analytics prefixes via `PARENT_TOUR_ANALYTICS`.
- Follow-ups: Playwright `@parent-tours` on isolated E2E stack + parent seed (Task 8 in plan); optional L2 fixtures for every content screen.
- Spec: `docs/superpowers/specs/2026-07-12-parent-portal-guided-tours-design.md`.
