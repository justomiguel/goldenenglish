# Plan: Contextual “Explain this screen” (admin hub)

**Spec:** [`docs/superpowers/specs/2026-07-11-admin-help-explain-screen-design.md`](../specs/2026-07-11-admin-help-explain-screen-design.md)  
**Date:** 2026-07-11

## Approach

1. Pure `screenCatalog` + path resolver + `explainAdminHomeTour` step builder.
2. Extend `ADMIN_TOUR_ANCHORS` + wire `data-tour` on shell/hub.
3. Client `startExplainScreenTour` via existing `runDriverTour`.
4. UI: `AdminHelpExplainScreenBlock` first in help panel; launcher resolves by pathname.
5. Dictionaries en/es/pt + analytics entity prefix.
6. Vitest vertical slices.

## Tasks

- [x] Approval marker + this plan
- [x] `resolveAdminScreenTour` + tests
- [x] Anchors + `buildExplainAdminHomeSteps` + tests
- [x] `startExplainScreenTour` + launcher/start wiring
- [x] UI block + launcher integration + tests
- [x] Anchors on AdminSidebar / AdminChromeHeader / AdminHubHome
- [x] i18n keys (en/es/pt)
- [x] ADR/rule note + run vitest
- [ ] Manual QA (user): FAB on `/dashboard/admin` explain tour; FAB on another admin page → disabled CTA

## Defaults (approved)

- No tour → disabled CTA + short message
- One step per metric card
- Single sidebar overview step
