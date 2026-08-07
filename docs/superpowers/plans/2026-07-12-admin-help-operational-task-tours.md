# Plan — Operational admin task tours (Phase A first)

**Spec:** `docs/superpowers/specs/2026-07-12-admin-help-operational-task-tours-design.md`

## Phase A scope

1. Catalog `group` + FAB group headings; migrate existing 5 tours into groups.
2. Tours: `create-event`, `approve-payment`, `reject-payment`, `take-attendance`, `assign-scholarship-percent`, `assign-scholarship-full`.
3. Anchors, builders, starters, dict en/es/pt, matrix rows, Vitest.

## Later (not this PR slice unless time)

- Phase B: MP, Flow, currency
- Phase C: blog, reset password, import users

## File map (Phase A)

- `catalog.ts`, `tutorialCatalogIcons.ts`, `AdminHelpTutorialList.tsx`
- `selectors.ts` + UI components (event create, finance inbox, attendance, scholarship)
- `createEventTour.ts`, `approvePaymentTour.ts`, `rejectPaymentTour.ts`, `takeAttendanceTour.ts`, `assignScholarshipTour.ts` (+ shared)
- `client/start*.ts`, `startAdminTutorial.ts`
- `listTourRuntimeChecks.ts`
- dictionaries + Vitest contracts
