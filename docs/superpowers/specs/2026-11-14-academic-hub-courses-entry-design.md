# Cursos: sidebar name and section-first hub

**Intent:** The institute admin sidebar calls this area Cursos. Opening it shows the sections of the current cohort. A combo at the top switches the cohort. Staff do not open a cohort list before they see sections.

**Done when:**

- `dashboard.adminNav.academics` is Cursos / Courses / Cursos in `es.json`, `en.json`, and `pt.json`.
- The hub page title uses the same string. The existing test that equates the nav label and the hub title still passes.
- `/[locale]/dashboard/admin/academic` renders the cohort workspace for the cohort with `is_current`: overview, sections, retention, and transfers. The sections tab is selected on entry. A `tab` query still opens that tab.
- A combo sits above that list. Its label is Año/Cohorte in Spanish, Year/Cohort in English, and Ano/Coorte in Portuguese. The current cohort is selected when the URL has no `cohort` query. Choosing another cohort writes `?cohort=<id>` and shows that cohort's sections on the same page.
- Archived cohorts stay in the combo, after the active ones, with the archived label. They are not the default.
- If no cohort is current and the URL has no `cohort`, the combo has no selection and the section list is empty. The empty sentence tells staff to pick a cohort or create one.
- The new-cohort action stays on this page.
- The combo has no link to the cohort page.
- The two-tab cohort board is not the landing view.

**Out of scope:**

- Teacher sidebar.
- Renaming the words cohorte and sección inside forms, fees, tours, or the student file.
- Removing the cohort page.
- CentroListo.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). The academic hub and the cohort page have no `src/components/pwa/` tree. The sections tab is a table list, not a card grid. Each row shows the section name, the teacher names, and the schedule. Shared section actions keep the same props.

## Behavior

1. Load cohorts with `id, name, is_current, archived_at`.
2. Resolve the selected id: valid `cohort` query, else the current cohort, else none.
3. When an id is resolved, render `AcademicCohortWorkspace` with `defaultTab` `sections`. That workspace is the same tabbed panel the cohort page uses.
4. The combo is a native `select`. Active cohorts come first. The current cohort is marked in its option label. Archived cohorts follow.
5. Changing the combo uses `router.replace` and keeps other query keys.
6. The cohort page route stays. Deep links to a cohort and to a section stay.

## Tests

- The nav label equals the hub title in es, en, and pt, and the Spanish label is Cursos.
- The hub entry shows the cohort workspace. The sections tab is selected. The old active/archived cohort tabs are gone.
- The sections tab is a table. Each row shows the section name, the teacher names, and the schedule.
- A `cohort` query selects that cohort's sections.
- With no current cohort and no query, the section list is absent and the empty sentence is visible.
