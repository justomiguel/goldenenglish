# Admin help — create-cohort year branch + section handoff (mini design)

**Date:** 2026-07-11  
**Status:** Approved  
**Extends:** [`2026-07-11-admin-help-tutorials-design.md`](./2026-07-11-admin-help-tutorials-design.md), [`2026-07-11-admin-help-create-section-design.md`](./2026-07-11-admin-help-create-section-design.md)

## Intent

When the create-cohort tutorial runs and a cohort for the **current calendar year** already exists, staff choose **in the Driver.js popover** (not a separate admin modal) whether to open that cohort or create another for the same year. Choosing the existing cohort ends the create-cohort tour on the cohort detail page and offers a **handoff** to the create-section tutorial.

Copy must state the **annual cohort model**: one cohort per school year; morning/afternoon shifts belong in **sections**, not separate cohorts.

## Domain rule (annual cohort)

| Concept | Rule |
|---------|------|
| Cohort | **One per calendar/school year** for the institute |
| Section | Holds shift, schedule, teacher, enrollments **inside** the year’s cohort |
| Tutorial intro | Must explain hierarchy cohort → section → course before mechanical steps |

Detection: `fetchCohortYearContext()` (calendar year match) before pre-modal steps; branch step inserted only when `existing` is present.

## Tour flows

### A — Create path (new cohort, with or without year branch → create new)

```
intro → [nav] → New cohort → [optional branch → create new] → modal steps
  → staff creates for real → Phase B on cohort detail
  → handoff popover (propose create-section tour)
       ├─ Primary: «Continuar con crear secciones» → startCreateSectionTour()
       └─ Secondary: «Ahora no» → end
```

### B — Existing year cohort → use existing

```
intro → [nav] → New cohort (Next → branch step)
  → branch popover (in-tour, custom footer)
       ├─ Primary: «Seguir con la cohorte actual»
       │     → router.push cohort detail
       │     → destroy create-cohort tour (no modal, no Phase B create path)
       │     → handoff popover on cohort detail (same as after create)
       │          ├─ Primary: «Continuar con crear secciones» → startCreateSectionTour()
       │          └─ Secondary: «Ahora no» → end
       └─ Secondary: «Crear una nueva cohorte»
             → end branch tour
             → set tour session active **before** opening modal
             → AcademicNewCohortModal opens with `stackBelowTour` / `show()` (never `showModal` top-layer)
             → modal tour steps (name → submit); **Listo** ends tour chrome only — modal stays open for real create
             → after create, Phase B on new cohort detail → **handoff** (same as path A)

**Modal + Driver contract:** Native `showModal()` puts the dialog in the top layer above Driver.js. Always activate `adminTourSession` first, open with `show()`, wait until `dialog.open && !dialog.matches(":modal")`, then `drive()`. `show()` has no native `::backdrop` — `ModalStackedScrim` restores the same blur/wash as system modals under the dialog; Driver overlay stays a separate higher layer. When the tour ends (**Listo**), keep `show()` + scrim (retain `stackBelowTour`) — do **not** promote via `close()`+`showModal()`.

**Launcher busy:** `AdminHelpLauncher` `busyId` must clear when the interactive tour chrome ends (or when Help is reopened). After modal **Listo**, Phase B waits for a real create in the background — do **not** `await` that wait inside `startCreateCohortTour` or Play stays spinning for up to 10 minutes.
```

### Branch step UX

- **In-tour only** — `existingCohortBranch: true` on step def; `runDriverTour` renders two footer buttons (hide default Next).
- **Popover** — CSS class `ge-admin-tour-popover-branch` (wider, stacked footer).
- **Button order** — secondary left (create new), primary right (use existing).
- **Templates** — `{{year}}`, `{{name}}` in `existingCohortPrompt` via `fillTourTemplate`.

### Handoff step UX

- Anchor: `academic-cohort-detail`.
- `handoffCreateSectionTour: true`; custom footer: dismiss (secondary) + start section tour (primary).
- Runs after **use-existing** and after **create path Phase B** (any successful land on cohort detail).
- Wired in `startAdminTutorial` via `startCreateSectionTour` callback.

## i18n

Keys under `dashboard.adminHelpTours.createCohort`:

| Key | Purpose |
|-----|---------|
| `existingCohortPrompt.*` | Branch title, description, body, `useExisting`, `createNew` |
| `handoffToCreateSection.*` | Handoff title, description, `startSectionTour`, `dismiss` |
| `steps.intro.*` | Annual cohort + hierarchy context |

Locales: **en**, **es**, **pt** (aligned shape).

## Observability

Extend `admin_tutorial:create-cohort` metadata phases:

- `use_existing_cohort`, `complete_use_existing`
- `confirm_create_duplicate_year`
- `handoff_start_section_tour`, `handoff_dismiss`

No PII in metadata; `cohortId` UUID only where already in scope.

## Testing

| File | Coverage |
|------|----------|
| `createCohortTour.test.ts` | Branch + handoff step builders |
| `startCreateCohortTour.test.ts` | `branch-use-existing` → handoff; `branch-create-new` → modal tour |
| `startAdminTutorial.test.ts` | `startCreateSectionTour` wired |

Self-contained per `30-harness-self-contained-tests.mdc`.

## Out of scope

- Separate `AdminTutorialPromptHost` / native confirm for duplicate year.
- Auto-starting create-section without user click on handoff primary.
- Persisted “don’t ask again” for duplicate year.

## Done when

- [x] In-tour branch when year cohort exists; no external prompt modal.
- [x] Use existing → cohort detail → handoff → optional `create-section` tour.
- [x] Create new → modal + modal tour + Phase B → **handoff** to create-section.
- [x] Intro/copy states annual cohort model (rule `31-admin-tutorials-copy.mdc`).
- [x] i18n en/es/pt; analytics phases; Vitest for branch/handoff paths.

## Definition of done (verification)

**Manual QA (user):** on a dev tenant with an existing current-year cohort:

1. Start create-cohort tour → branch appears after New cohort Next.
2. **Seguir con la cohorte actual** → lands on detail → handoff → **Continuar** starts section tour.
3. **Crear una nueva cohorte** → modal opens → create → Phase B → handoff → **Continuar** starts section tour.

Agent: Vitest only (`32-manual-qa-user-owned.mdc`). User owns the checklist above.
