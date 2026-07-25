# Parent portal guided tours — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship explain-screen + task Driver.js tours for the parent/tutor portal on desktop and mobile/PWA per `docs/superpowers/specs/2026-07-12-parent-portal-guided-tours-design.md`.

**Architecture:** Parallel bounded context `src/lib/parent-tutorials/` (catalog, screen registry, surface-tagged steps, selectors). Simplified `runParentDriverTour` reuses Driver.js + layout sync patterns without admin branch/modal hooks. `ParentHelpLauncher` mounts in desktop + PWA shells only.

**Tech Stack:** Next.js App Router, Driver.js, Vitest/RTL, Playwright `@parent-tours` on isolated E2E, dictionaries en/es/pt.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-12-parent-portal-guided-tours-design.md` (Approved).
- File size ≤250 lines; one main export per file (`03-architecture`).
- Visible copy only via dictionaries (`09`); en+es+pt together.
- Tier A: desktop + PWA trees; surface filter at tour start (`05`).
- No `admin-tutorials` pollution; thin reuse of layout-sync helpers OK.
- Analytics: `parent_screen_tour:*` / `parent_tutorial:*` (`08`).
- Tours stay in sync: L1 inventory + L2 DOM + L3 isolated E2E (`33` sibling).
- Complete solutions — no “explain-only stub forever” without catalog rows for all 7 tasks.

## File map

| Path | Responsibility |
|------|----------------|
| `src/lib/parent-tutorials/selectors.ts` | `PARENT_TOUR_ANCHORS` + selector helper |
| `src/lib/parent-tutorials/parentTourStepDef.ts` | Step type + `surfaces` + `optional` |
| `src/lib/parent-tutorials/filterStepsForSurface.ts` | Filter by desktop/mobile |
| `src/lib/parent-tutorials/filterParentTourStepsForDom.ts` | Drop optional missing anchors |
| `src/lib/parent-tutorials/screenCatalog.ts` | pathname → screen tour match |
| `src/lib/parent-tutorials/explainParentHomeTour.ts` | Home chrome+content steps |
| `src/lib/parent-tutorials/explainContentOnlyTour.ts` | Shared content-only builder |
| `src/lib/parent-tutorials/screenTourDefs.ts` | Defs for all content-only screens |
| `src/lib/parent-tutorials/catalog.ts` | Task tutorial ids + icons |
| `src/lib/parent-tutorials/listTourRuntimeChecks.ts` | L1/L2/L3 matrix |
| `src/lib/parent-tutorials/client/runParentDriverTour.ts` | Driver runner (simple) |
| `src/lib/parent-tutorials/client/startExplainParentScreenTour.ts` | Explain dispatcher |
| `src/lib/parent-tutorials/client/startParentTutorial.ts` | Task dispatcher |
| `src/lib/parent-tutorials/*Tour.ts` | One pure builder per task |
| `src/components/dashboard/ParentHelpLauncher.tsx` | FAB + panel |
| `src/components/dashboard/ParentHelpExplainScreenBlock.tsx` | Explain CTA (or reuse admin molecule if props identical) |
| Shells / nav / home | `data-tour` anchors |
| Dictionaries | `dashboard.parentHelp*` |
| `docs/adr/2026-07-parent-help-driverjs-tutorials.md` | ADR |
| `.cursor/rules/35-parent-tutorials-*.mdc` | Copy + contract |
| `e2e/` + seed | `@parent-tours` |

---

### Task 1: Screen catalog + selectors + surface filter (TDD)

**Files:**
- Create: `src/lib/parent-tutorials/{selectors,parentTourStepDef,filterStepsForSurface,screenCatalog}.ts`
- Test: `src/__tests__/lib/parent-tutorials/screenCatalog.test.ts`, `filterStepsForSurface.test.ts`

- [ ] Write failing tests for path matching (home, calendar, child detail, reject task instance / mp-return).
- [ ] Write failing tests for surface filter (`desktop` vs `mobile` vs `both`).
- [ ] Implement modules until green.
- [ ] Commit (only if user asked; otherwise leave uncommitted).

### Task 2: Parent home explain builder + runner

**Files:**
- Create: `explainParentHomeTour.ts`, `filterParentTourStepsForDom.ts`, `client/runParentDriverTour.ts`, `client/startExplainParentScreenTour.ts`
- Test: `explainParentHomeTour.test.ts`, `startExplainParentScreenTour.test.ts` (mock runner)

- [ ] Failing tests: step order includes surface-tagged chrome; optional content steps.
- [ ] Implement builder + simple Driver runner (popover class `ge-parent-tour-popover`; reuse `bindTourLayoutSync` if importable without admin session side effects — else duplicate minimal settle helper).
- [ ] Green + analytics track on start (`parent_screen_tour:parent-home`).

### Task 3: Dictionaries (launcher + home + explain chrome) + types

**Files:** `src/dictionaries/{en,es,pt}.json`

- [ ] Add `parentHelpLauncher`, `parentHelpExplainScreen`, `parentHelpScreenTours.parentHome` (+ stub empty shells for other meta keys as screens land).
- [ ] Add `parentHelpCatalog` list chrome + empty message (task entries in Task 6).

### Task 4: ParentHelpLauncher + mount

**Files:**
- Create: `ParentHelpLauncher.tsx` (+ reuse `AdminHelpChatPanel` / explain block pattern)
- Modify: `ParentDashboardShellClient.tsx`, `ParentPwaShell.tsx`, `parent/layout.tsx` (pass dict slices if needed)
- Test: `ParentHelpLauncher.test.tsx`

- [ ] RTL: FAB opens panel; Explain calls startExplain; unavailable when no match.
- [ ] Desktop: FAB `md:flex` corner; PWA: visible with safe-area above tab bar (`bottom` offset).
- [ ] Wire `data-tour` on sidebar root, tab bar, header profile/sign-out, home title/content regions.

### Task 5: Remaining content-only explain tours

For each screen in spec inventory: defs + dict steps + anchors on UI + `screenCatalog` already matching.

Order: calendar → progress → payments → messages → settings → profile → billing → tasks → assessments → badges → child-detail.

- [ ] Per screen: Vitest dict contract key presence + optional L2 fixture when shell exists.
- [ ] Cap 4–8 steps; mark empty-state anchors optional.

### Task 6: Task tutorials (7)

| Id | Builder file |
|----|----------------|
| `parent-pay-or-upload-receipt` | `payOrUploadReceiptTour.ts` |
| `parent-view-child-progress` | `viewChildProgressTour.ts` |
| `parent-read-reply-messages` | `readReplyMessagesTour.ts` |
| `parent-manage-child-or-tutor-profile` | `manageChildOrTutorProfileTour.ts` |
| `parent-calendar-attendance` | `calendarAttendanceTour.ts` |
| `parent-badges-overview` | `badgesOverviewTour.ts` |
| `parent-settings-notifications` | `settingsNotificationsTour.ts` |

- [ ] Catalog + icons + `startParentTutorial` switch.
- [ ] Dict catalog + `parentHelpTours.*` step copy.
- [ ] Unit tests for step builders / dispatcher.

### Task 7: Contracts L1/L2 + rules + ADR

- [ ] `listTourRuntimeChecks`, inventory, DOM presence tests.
- [ ] Cursor rules for parent tutorials copy + staleness.
- [ ] ADR sibling for parent Help FAB.
- [ ] Extend analytics constants/route Zod if needed (+ migration if enum).

### Task 8: E2E `@parent-tours` + seed

- [ ] Parent/tutor + ward in e2e seed; env documented.
- [ ] Playwright matrix over `listTourRuntimeChecks` for parent; isolated stack only.
- [ ] Runbook note under e2e-isolated-harness.

> **Status:** Core product (Tasks 1–7) shipped. Task 8 remains follow-up before treating L3 as gate-complete.

### Task 9: Manual QA checklist handoff

- [ ] Confirm DoD checklist in spec; leave Manual QA for user (`32`).

---

## Verification

```bash
npx vitest run src/__tests__/lib/parent-tutorials src/__tests__/components/ParentHelpLauncher.test.tsx
# later: npm run test:e2e:precommit  # requires .env.local.e2e
```
