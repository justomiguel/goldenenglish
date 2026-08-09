# Parent Portal Redesign — Phases 2 to 6 Implementation Plan

Spec: `docs/superpowers/specs/2026-08-07-parent-portal-layout-redesign-design.md`
Phase 1 (shell) is done: `docs/superpowers/plans/2026-08-07-parent-portal-shell-phase-1.md`.

## Sequencing decision

The spec numbers Desktop as phase 5 and Mi hijo as phase 4, on the assumption each phase ships
separately. Since all of it lands in one pass, two merges avoid building throwaway intermediates:

- **Phases 2 and 4 merge.** Phase 2 kills the Progress hub, so `/parent/child` has to absorb its
  content the moment the hub dies. Building a placeholder child screen in phase 2 and replacing it in
  phase 4 would mean writing the same screen twice.
- **Phase 5 folds into the screens.** `PortalTopNav` already shipped in phase 1. What is left of
  "Desktop" is the two-column layout of Hoy and Mi hijo, which belongs to the phase that writes each
  screen, plus deleting `ParentSidebar` and `ParentBreadcrumb`, which cannot happen until the student
  portal stops using them in phase 6.

Execution order: routes and redirects, then Mi hijo, then Hoy, then the calendar split, then the
student portal, then deletion of the dead components.

## Step A — Route tree and redirects

### New routes

| Route | Renders |
|-------|---------|
| `/parent/child` | Mi hijo (step B) |
| `/parent/child/attendance` | Attendance history, moved out of `/parent/calendar` |
| `/parent/child/grades` | Cohort assessments and mini-tests, merged |
| `/parent/child/tasks` | `ParentTasksListScreen`, standalone |
| `/parent/child/feedback` | `ParentFeedbackSurface` |
| `/parent/child/badges` | `ParentBadgesScreen`, standalone |
| `/parent/child/edit` | Ward profile form, moved from `children/[studentId]` |
| `/parent/account` | The account list as a page |

The active child comes from `?studentId`, resolved by `resolveParentFocus`, never from a path
segment. A path segment would make every link in the portal depend on knowing the child's id, and
would give the one-child family — the common case — an ugly address for no benefit.

### Redirects

All permanent, all preserving `studentId` and `sectionId`, one test each.

| From | To |
|------|-----|
| `/parent/progress` | `/parent/child` |
| `/parent/progress?tab=exams` and `?tab=assessments` | `/parent/child/grades` |
| `/parent/progress?tab=tasks` | `/parent/child/tasks` |
| `/parent/progress?tab=feedback` | `/parent/child/feedback` |
| `/parent/progress?tab=badges` | `/parent/child/badges` |
| `/parent/tasks` | `/parent/child/tasks` |
| `/parent/assessments` | `/parent/child/grades` |
| `/parent/feedback` | `/parent/child/feedback` |
| `/parent/badges` | `/parent/child/badges` |
| `/parent/settings` | `/parent/account` |
| `/parent/children/[studentId]` | `/parent/child/edit?studentId=<id>` |

`/parent/billing` keeps its existing redirect to `/parent/payments?tab=fees`.
`/parent/tasks/[taskInstanceId]` stays: it is a detail route, not a hub tab.

### Destinations drop to four

`buildParentShellConfig` returns Hoy, Mi hijo, Pagos, Mensajes. `Mi hijo` claims `/parent/child`,
`/parent/calendar` and every legacy prefix through `matchPrefixes`, so a parent who lands on a
redirected URL still sees the right tab lit.

### Tours

`screenCatalog` gains `parent-child` and drops the tab-based resolution for tasks, assessments and
badges. `parent-progress` and `parent-settings` tour ids are removed along with their screens;
`parent-child-detail` repoints at `/parent/child/edit`. Anchors, the L1 runtime matrix and the L2 DOM
fixtures move in this step, per `.cursor/rules/36-parent-tutorials-contract.mdc`.

## Step B — Mi hijo

Header with the child's name, section and teacher; a three-metric strip (attendance, average,
pending tasks) linking into the sections; then five section previews in fixed order — asistencia,
notas, comentarios, tareas, logros — each with its own "ver todo". Sections load and fail
independently through `createProgressFailureTracker`, so one dead query never blanks the screen.
Desktop puts the summary and metrics in the left column and the sections in the right.

## Step C — Hoy

`buildParentTodayFeed`, a pure function over the existing loaders' output. Ordering is by kind, not
recency: overdue payment, unread message, task due within 48 hours, unexcused absence, payment due
within 7 days, then push and install. At most three actions, "ver todo" expands in place. Sources
load with `Promise.allSettled`; every rejected source becomes a named retry card, because the absence
of an alert reads as "everything is fine".

## Step D — Calendar split

`/parent/calendar` keeps the agenda and the ICS feed. The attendance body moves to
`/parent/child/attendance`. Both keep using `ParentAttendancePwaScreen` and the calendar payload;
only the composition changes.

## Step E — Student portal

`buildStudentShellConfig` with student labels — Hoy, Mi curso, Pagos, Mensajes — pointing at the
student routes that exist today, its own tour anchors, and `includePayments` still coming from
`getProfilePermissions`. The student layout swaps `ParentDashboardShell` for `PortalShell`.

## Step F — Deletion

Once nothing imports them: `ParentDashboardShell`, `ParentDashboardShellClient`, `ParentPwaShell`,
`ParentPwaTabBar`, `resolveParentPwaTab`, `ParentSidebar`, `ParentSidebarNavContent`,
`parentSidebarNavGroups`, `ParentBreadcrumb`, the three `ParentFocusSwitcher*`, `ParentWardPicker`,
`ParentProgressEntry`, `buildProgressPickerOptions`, `progressPickerOption`,
`ProgressSectionPicker` and its two surfaces, `ParentSettingsScreen`, `ParentSettingsEntry`,
`ParentHomeInbox`, `ParentHomePwaFocus`, `ParentHomeStatusGrid` and the pillar builders. Their tests
go with them.

## Verification per step

`npx vitest run` on the touched suites, then `npx tsc --noEmit` and `npm run lint`. Full suite at the
end. Nothing is committed.
