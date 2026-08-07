# Admin help — create section tutorial (mini design)

**Date:** 2026-07-11  
**Status:** Approved (extends `2026-07-11-admin-help-tutorials-design.md`)

**Entry points:** Help catalog **Play**; optional handoff from create-cohort tour (`handoffToCreateSection` — see [`2026-07-11-admin-help-create-cohort-branch-handoff-design.md`](./2026-07-11-admin-help-create-cohort-branch-handoff-design.md)).

## Intent

Second catalog tutorial: guide staff to create a **section** inside the year’s cohort (shifts, teacher, schedule live here — not in separate cohorts).

## Done when

- Catalog entry `create-section` with i18n (en/es/pt), Lucide icon, Play → Driver tour.
- Resolves target cohort (`is_current`, else calendar-year match); if none, notice modal (no native dialog).
- Navigates to `/{locale}/dashboard/admin/academic/{cohortId}?tab=sections`.
- Steps: intro → sections tab → new section → modal (basics, period, schedule, submit) → phase B on section detail.
- Real `createAcademicSectionAction`; ends on section detail URL after create or if tour interrupted after create.
- `data-tour` anchors + tutorial events; section modal `stackBelowTour` when tour active.
- Vitest for step builders + start runner smoke; analytics `admin_tutorial:create-section`.

## Out of scope

- Copy-sections / rollover tours.
- Student/parent surfaces.
- Persisted tutorial progress.
