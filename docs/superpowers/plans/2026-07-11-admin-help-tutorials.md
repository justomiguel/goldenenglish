# Admin Help Tutorials Implementation Plan

> **For agentic workers:** Implement task-by-task with TDD. Steps use checkbox syntax.

**Goal:** Unify the admin FAB into Search | Help tabs and ship a Driver.js “create cohort” guided tour.

**Architecture:** Pure catalog under `src/lib/admin-tutorials/`; client Driver runner with dynamic import; evolve `AdminCommandPalette` into a tabbed launcher; stable `data-tour` anchors on nav/toolbar/modal/detail.

**Tech Stack:** Next.js App Router, React client components, Driver.js, Vitest + Testing Library, dictionaries en/es/pt.

## Global Constraints

- File size ≤ 250 LOC; one main named export per component file.
- User-visible copy in `en.json` + `es.json` (+ `pt.json` keep shape aligned).
- No second FAB; FAB click → Help; ⌘K → Search; FAB icon `CircleHelp`.
- Dynamic import Driver.js only when a tour starts.
- Real cohort creation only (no fake inserts).
- ADR in `docs/adr/` with the feature.
- Analytics via `trackEvent` / `action` + entity `admin_tutorial:create-cohort`.
- Spec: `docs/superpowers/specs/2026-07-11-admin-help-tutorials-design.md`.

## File map

| Path | Role |
|------|------|
| `src/lib/admin-tutorials/types.ts` | TutorialId, step types |
| `src/lib/admin-tutorials/selectors.ts` | `data-tour` selector helpers |
| `src/lib/admin-tutorials/catalog.ts` | Tutorial catalog entries |
| `src/lib/admin-tutorials/createCohortTour.ts` | Step definitions (selectors + copy keys) |
| `src/lib/admin-tutorials/academicHubPath.ts` | Path match helpers |
| `src/lib/admin-tutorials/client/runDriverTour.ts` | Driver.js wrapper |
| `src/lib/admin-tutorials/client/startCreateCohortTour.ts` | Navigate + run create-cohort |
| `src/hooks/useAdminCreateCohortTour.ts` | Hook wiring locale/router/dict/analytics |
| `src/components/dashboard/AdminHelpLauncher.tsx` | FAB + modal shell + tabs |
| `src/components/dashboard/AdminHelpSearchPanel.tsx` | Existing search UI |
| `src/components/dashboard/AdminHelpTutorialList.tsx` | Help list |
| `docs/adr/2026-07-admin-help-driverjs-tutorials.md` | ADR |
| Modify: toolbar, modal, sidebar nav, cohort detail, layout, globals CSS for Driver tokens, dictionaries, tests |

---

### Task 1: Types, selectors, catalog (pure) + tests

**Files:** create types/selectors/catalog/path helpers; tests under `src/__tests__/lib/admin-tutorials/`

- [ ] Failing tests for catalog id `create-cohort` and selector `[data-tour="academic-new-cohort"]`
- [ ] Implement pure modules
- [ ] Tests pass

### Task 2: Install Driver.js + ADR + CSS tokens + i18n

- [ ] `npm install driver.js`
- [ ] ADR
- [ ] Dictionary keys (en/es/pt)
- [ ] Minimal Driver CSS overrides in `globals.css` using CSS variables

### Task 3: Anchors + open-modal event

- [ ] `data-tour` on nav academic, new cohort button, name/submit, cohort detail
- [ ] Toolbar listens for `ge:admin-tutorial:open-new-cohort` CustomEvent to open modal
- [ ] Smoke tests for attributes / event

### Task 4: Driver runner + create-cohort orchestrator

- [ ] Mocked Driver unit tests
- [ ] `runDriverTour` + `startCreateCohortTour` (navigate, wait for anchor, steps, Phase B timeout)

### Task 5: AdminHelpLauncher UI

- [ ] Split/replace `AdminCommandPalette`; layout passes new dict slices
- [ ] RTL: tabs, FAB→Help, ⌘K→Search, start tutorial button

### Task 6: Wire analytics + polish CommandPalette

- [ ] `trackEvent` on start/complete/skip
- [ ] Re-export or delete old component; update layout import
- [ ] Full test run for touched suites

---

### Task 7: Create-cohort year branch + section handoff (spec amendment)

**Spec:** `docs/superpowers/specs/2026-07-11-admin-help-create-cohort-branch-handoff-design.md`

- [x] `fetchCohortYearContext` + `buildExistingCohortBranchStep` in pre-modal flow
- [x] In-tour branch footer (`branch-use-existing` / `branch-create-new`) in `runDriverTour`
- [x] Use existing → `openCohortDetail` → `buildCreateCohortHandoffStep` → `startCreateSectionTour`
- [x] Create new → modal tour + Phase B
- [x] i18n `existingCohortPrompt` + `handoffToCreateSection` (en/es/pt)
- [x] `ge-admin-tour-popover-branch` CSS
- [x] Vitest: `createCohortTour`, `startCreateCohortTour`, `startAdminTutorial`
- [ ] **Manual QA (user):** branch + handoff on tenant with existing year cohort — see mini-spec checklist

---

**Commit policy:** Do not commit unless the user asks.
