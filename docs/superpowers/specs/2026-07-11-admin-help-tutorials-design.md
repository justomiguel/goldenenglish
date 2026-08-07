# Admin help FAB + guided tutorials (design)

**Date:** 2026-07-11  
**Status:** Approved for implementation planning  
**Scope (v1):** Admin dashboard only (Tier B). Tutorials FAB (chat panel) + separate student-search FAB. Driver.js. First tour: create a cohort.

## Context

Admins need in-product guidance for recurring tasks. Today:

- `AdminCommandPalette` is a fixed bottom-right FAB that opens student search (⌘/Ctrl+K).
- Cohort creation lives on `/{locale}/dashboard/admin/academic` via `AcademicHubToolbar` → `AcademicNewCohortModal` → `createAcademicCohortAction` → cohort detail.
- There is no product-tour library and no help catalog.

We will not invent a custom spotlight engine. We adopt **Driver.js** (MIT, ~5 KB, overlay + element highlight).

## Goals

1. One FAB opens a panel with tabs **Search** | **Help**.
2. Help lists predetermined Q&A / tutorial entries that start guided tours.
3. First tour walks **create a cohort** end-to-end (navigate if needed, highlight controls, darken the rest).
4. Copy via dictionaries; tokens via design system; analytics on tour start/complete/skip.

## Non-goals (v1)

- Student / parent / PWA surfaces.
- Persisted checklist progress or CMS-authored tutorials.
- Replacing site-setup wizard or command-palette search semantics.
- Intro.js (AGPL) or competing tour libraries.

## Decision summary

| Topic | Choice |
|-------|--------|
| Tour engine | **Driver.js** (dynamic import on tour start) |
| Shell | **Tutorials FAB** + chat panel (`AdminHelpLauncher`); student search stays on **`AdminCommandPalette`** (FAB + ⌘K) |
| Tabs | None on the tutorials panel |
| Visibility | Both FABs on admin layout (desktop `md+`); tutorials stacked above search |
| First tour | `create-cohort` |
| Styling | Driver popover/overlay CSS variables mapped to brand tokens; no hardcoded brand hex in TSX |
| Governance | ADR under `docs/adr/` in the same change set as implementation |

### Alternatives rejected

- **Unified Search\|Help tabs on one FAB** — mixes intents; tutorials FAB stays focused.
- **React Joyride** — larger bundle, opinionated UI harder to align with DS.
- **Shepherd.js** — more config surface than needed for v1.

## Architecture

```
Admin layout
  └─ AdminHelpLauncher (rename/evolve from AdminCommandPalette)
       ├─ FAB (CircleHelp icon)
       └─ Modal
            ├─ Tab strip: Search | Help  (UnderlineTabBar / APG tabs pattern already in repo)
            ├─ Search panel → AdminStudentSearchCombobox (unchanged behavior)
            └─ Help panel → AdminHelpTutorialList
                 └─ onSelect(tutorialId) → startAdminTutorial(tutorialId)

src/lib/admin-tutorials/
  ├─ catalog.ts          # pure: id, titleKey, routes, steps metadata
  ├─ createCohortTour.ts # step defs + data-tour selectors (pure where possible)
  └─ types.ts

src/lib/admin-tutorials/client/ (or hooks/)
  └─ runDriverTour.ts    # dynamic import('driver.js'), destroy on complete/skip
```

**Dependency direction:** pure catalog/steps have no React/Supabase; client runner is the only Driver.js importer; UI receives catalog filtered by locale dict + optional `pathname`.

### Stable anchors (`data-tour`)

Add explicit attributes (not fragile class names) on:

| Anchor | Element |
|--------|---------|
| `data-tour="admin-nav-academic"` | Sidebar Academic hub link |
| `data-tour="academic-new-cohort"` | New cohort button in `AcademicHubToolbar` |
| `data-tour="academic-new-cohort-name"` | Name field in `AcademicNewCohortModal` |
| `data-tour="academic-new-cohort-submit"` | Submit in modal |
| `data-tour="academic-cohort-detail"` | Cohort detail shell (post-create / if already on page) |

Implementation must keep anchors on the interactive element itself (or a stable wrapper that Driver can scroll into view).

## UI / UX

### Launcher

- Keep **one** fixed bottom-right FAB (`z-40`, same placement classes as today).
- Defaults: FAB click → **Help** tab; ⌘/Ctrl+K → **Search** tab. No deep-link query in v1.
- FAB opens a **compact chat-style panel** anchored above the button (not a full-screen `Modal`). No message composer — only tabs + preset tutorial actions / search.
- FAB accessible name covers both intents (dictionary), e.g. “Search students and help”.
- FAB icon: Lucide `CircleHelp`. Search remains discoverable via ⌘K and the Search tab. Tooltip/title mentions both.

### Help list

Each row:

- Short question / title (dict).
- One-line description (dict).
- Primary action: “Start tutorial” (dict) with leading Lucide icon (`Play` / `BookOpen`).

v1 catalog entry:

1. **Create a cohort** (`create-cohort`) — available from any admin route; runner navigates to academic hub first if needed.

Empty state if a future filter yields no items (dict).

### Academic model (tutorials must teach this)

- A **cohort is annual**: **one cohort per school/calendar year** for the institute. There are no separate “morning cohort” vs “afternoon cohort”.
- **Sections** (inside the year’s cohort) hold shift, schedule, teacher, and enrollments.
- Intro step copy explains cohort → section → course before mechanical steps (see `.cursor/rules/31-admin-tutorials-copy.mdc`).

### Tour behavior (`create-cohort`)

1. Close help modal.
2. If pathname is not academic hub, `router.push` to `/{locale}/dashboard/admin/academic`, wait for anchor `academic-new-cohort` (bounded poll with timeout → client warn if missing).
3. **Pre-modal steps:** intro → optional Academic nav → **New cohort**.
   - On Next at New cohort: if a cohort exists for the calendar year, show an **in-tour branch popover** (two footer buttons). **Do not** use a separate admin modal for this guard.
   - If no year cohort: auto-open `AcademicNewCohortModal` and continue.
4. **Branch (year cohort exists)** — full flow in [`2026-07-11-admin-help-create-cohort-branch-handoff-design.md`](./2026-07-11-admin-help-create-cohort-branch-handoff-design.md):
   - **Seguir con la cohorte actual** → navigate to existing cohort detail → end create-cohort tour → **handoff** popover proposing the create-section tutorial.
   - **Crear una nueva cohorte** → open modal (`stackBelowTour`) → modal steps → Phase B on new detail → **handoff** to create-section tour.
5. **Modal steps (create path):** name field, submit; user creates a **real** cohort (no fake insert).
6. **Phase B:** after submit on create path, one final step on `academic-cohort-detail`, then the same **handoff** popover as use-existing.

Driver `onDestroyStarted` / destroy cleanup must remove listeners and restore focus without leaving overlay stuck.

### Accessibility

- Tabs: keyboard Left/Right, selected tab `aria-selected`, panels `role="tabpanel"`.
- Driver.js focus trap respected; Escape closes tour (Driver default) and must not leave modal+tour stacked oddly (help modal already closed before tour).
- `prefers-reduced-motion`: rely on Driver config / CSS to shorten or disable animations where supported.
- All visible strings + `aria-label`s from `en.json` / `es.json`.

## i18n

New namespace (shape identical in `en` + `es`):

```
dashboard.adminHelpLauncher.*     # FAB titles, tab labels, modal chrome
dashboard.adminHelpCatalog.*      # per-tutorial titles, descriptions, CTAs
dashboard.adminHelpTours.createCohort.steps.*  # per-step titles/descriptions
dashboard.adminHelpTours.createCohort.existingCohortPrompt.*  # in-tour year branch
dashboard.adminHelpTours.createCohort.handoffToCreateSection.*  # section tour handoff
```

Reuse existing `adminCommandPalette` search strings under Search tab (either keep nested under launcher dict or compose both props from layout).

## Observability

Per `08-analytics-observability.mdc`:

- On tour **start** / **complete** / **skip**: `recordUserEventServer` or client `trackEvent` with stable `entity` (e.g. `admin_tutorial:create-cohort`) and metadata `{ tutorialId, stepIndex? }` sanitized.
- Prefer extending `UserEventTypeName` / `pathnameToEntity` only if required by existing unions; otherwise use allowed `action`/`click` types with entity prefix.
- No PII in metadata.

Ops errors (Driver failed to find element after timeout): `[ge:server]` not required on pure client; use `logClientWarn` with scope `admin.tutorials.createCohort`.

## Testing

| Layer | Coverage |
|-------|----------|
| Pure catalog / step builders | Unit: ids, selectors, route helpers |
| Launcher UI | RTL: tabs switch; ⌘K opens Search; FAB opens Help; list shows create-cohort |
| Tour runner | Unit with mocked `driver.js`: starts with expected steps; destroy on skip |
| Anchors | Smoke that toolbar/modal expose `data-tour` attributes |

REGRESSION CHECK notes: changing FAB must not break student search or ⌘K; cohort modal still works without tour.

## File / size constraints

- No file > 250 LOC (`03-architecture`).
- Split launcher into: shell modal + Search panel + Help panel + tab bar wiring if the current palette file grows.
- One primary named export per component file.

## Rollout

1. Dependency `driver.js` + types.
2. Anchors + catalog + runner.
3. Evolve command palette → help launcher UI.
4. Wire create-cohort tour.
5. ADR + dictionary keys + tests.
6. Manual QA on admin home and academic hub (Nago/dev tenant).

## Definition of done

- [ ] Single admin FAB; Search + Help tabs; defaults as above.
- [ ] `create-cohort` tour runs with Driver.js overlay from Help list.
- [ ] Dictionaries en/es; ADR; analytics events; Vitest coverage for new `src/lib` / components touched.
- [ ] No second FAB; no Intro.js; ⌘K still searches students.

## Open items closed in this spec

| Question | Resolution |
|----------|------------|
| FAB vs Search conflict | Separate FABs: tutorials above, search below + ⌘K |
| FAB click vs ⌘K | Tutorials FAB vs Search palette |
| FAB icon | Tutorials: `CircleHelp`; Search: `Search` |
| Fake cohort in tour? | No — user creates real cohort |
| Surfaces | Admin only v1 |
| Library | Driver.js |
