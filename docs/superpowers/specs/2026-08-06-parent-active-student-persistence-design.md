# Active student persists across the family portal

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 2 of 8
**Closes:** F01, F02 (behavior; see Out of scope for the visual half of F02)
**Related:** `parent/page.tsx`, `ParentChildSwitcher`, `ParentWardPicker`,
`ParentDashboardFamilyView`, `ParentHubBillingCard`, `ParentHomePwaFocus`,
`ParentSidebarNavContent`, `ParentBreadcrumb`, `ParentPwaTabBar`,
`loadChildrenSummariesForStudentIds`

## Intent

A parent of more than one child picks a child, reads one screen, clicks anything in the
menu, and is silently looking at a different child. Nothing on screen says the context
changed. Grades, attendance and fees all belong to a sibling.

## Context

The audit reported this as a query-parameter mismatch. Mapping the code found four
distinct defects that all produce the same symptom, and the parameter mismatch is only
the most visible one.

**1. Two parameter names.** The home reads `?child=`. Payments, progress, calendar, tasks,
assessments, badges and the task detail all read `?studentId=`.

**2. Two links cross the two names.** `ParentDashboardFamilyView.tsx:136` and
`ParentHubBillingCard.tsx:19` both build `/payments?child=…`, and the payments page reads
only `studentId`. That path loses the selection every single time, for every parent — it
is not an edge case.

**3. No navigation surface carries the selection.** `parentSidebarNavGroups`,
`ParentSidebarNavContent`, `ParentBreadcrumb`, `ParentPwaTabBar` and `ParentPwaShell` all
build bare hrefs. Unifying the parameter name alone would not fix the reported symptom,
because the menu drops the parameter whatever it is called. There is no persistence
anywhere else either: no cookie, no storage, no context, no database column.

**4. "First child" means different children on different screens.** With no parameter, every
page falls back to the first entry of its list. `listTutorStudentsWithFinance` sorts
alphabetically by display name; `loadChildrenSummariesForStudentIds` does not sort at all
and returns whatever order `tutor_student_rel` yields. So the home's default child and the
progress page's default child can be two different people.

Two further defects found in the same code, fixed here because they defeat the same goal:

**5.** `ParentHomePwaFocus.tsx:101` mounts the switcher with an inverted condition —
`multipleChildren ? null : <ParentChildSwitcher/>` — and the switcher itself returns null
for a single child. A parent with several children therefore has no way to switch from the
PWA home at all.

**6.** `ParentWardPicker.onChange` rebuilds the URL from its `basePath` prop, discarding
every other query parameter. Switching child on the progress page drops `?tab=`, throwing
the parent back to the default tab.

## Decisions

| Topic | Choice |
|-------|--------|
| Canonical parameter | `studentId`. Used by 7 routes today against the home's 1 |
| Legacy `?child=` | Home still accepts it as a fallback so existing bookmarks resolve, but never emits it |
| Where selection lives | The URL, as today. No cookie or storage |
| How the menu keeps it | The three client navigation surfaces read the current `studentId` and append it to their hrefs |
| Scope of that appending | Family portal only. On student routes there is no `studentId`, so the helper is a no-op |
| Default child | One deterministic order everywhere: alphabetical by display name |
| Picker consolidation | Behavior unified now; the two visual treatments stay (see Out of scope) |
| Database | No migrations |

### Why the URL and not a cookie

A cookie would survive navigation with no changes to the menu, which is tempting. It was
rejected because it makes the same address show different data to the same person
depending on invisible state, breaks sharing a link with the other parent, and cannot be
set from a server component without adding an action or route handler. Keeping the URL
authoritative also keeps every page's existing `searchParams` contract intact.

## Architecture

### A shared helper

New: `src/lib/parent/withStudentIdHref.ts`

```ts
export function withStudentIdHref(href: string, studentId: string | null): string
```

Returns `href` unchanged when `studentId` is null or empty, or when `href` already carries a
`studentId`. Otherwise appends it, respecting an existing query string. Pure, no DOM, no
router — trivially testable.

### Navigation surfaces

`ParentSidebarNavContent`, `ParentBreadcrumb` and `ParentPwaTabBar` are already client
components using `usePathname`. Each additionally reads
`useSearchParams().get("studentId")` and passes every href through `withStudentIdHref`.

All three are shared with the student portal since spec 1. Student routes never carry a
`studentId`, so the helper returns hrefs untouched and that portal is unaffected.

### Parameter unification

- `parent/page.tsx` reads `studentId`, falling back to `child` when `studentId` is absent.
- `ParentChildSwitcher` emits `?studentId=`.
- `ParentDashboardFamilyView.tsx:67` emits `?studentId=`.
- `ParentDashboardFamilyView.tsx:136` and `ParentHubBillingCard.tsx:19` emit
  `/payments?studentId=` — the two links that are broken today.

### Picker preserves context

`ParentWardPicker.onChange` builds from `window.location.href` instead of `basePath`, then
sets `studentId`, matching what `ParentPaymentsEntry` already does correctly. `basePath`
stays in the signature: it still decides which route the picker navigates to when that
differs from the current one.

### Deterministic default

`loadChildrenSummariesForStudentIds` sorts its result alphabetically by
`formatProfileNameSurnameFirst(firstName, lastName)`, lowercased, via `localeCompare` —
the same rule `listTutorStudentsWithFinance` already applies. "First child" then means the
same person on every screen.

### PWA switcher

`ParentHomePwaFocus.tsx:101` drops the inverted guard and mounts `ParentChildSwitcher`
unconditionally. The switcher already hides itself for a single child.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **`withStudentIdHref`** — null and empty student id return the href untouched; a bare
   href gains `?studentId=`; an href with an existing query gains `&studentId=`; an href
   that already has a `studentId` is returned unchanged; the value is URL-encoded.
2. **Sidebar** — rendered with `useSearchParams` returning `studentId=s2`, every nav link
   href carries `studentId=s2`; rendered with no search params, no href gains a query
   string.
3. **Tab bar** — same two assertions on `ParentPwaTabBar`.
4. **Breadcrumb** — same on `ParentBreadcrumb`, for a path deep enough to render crumbs.
5. **The broken links** — `ParentDashboardFamilyView` and `ParentHubBillingCard` link to
   payments with `studentId`, not `child`. The existing test at
   `src/__tests__/parent/ParentDashboardFamilyView.test.tsx` asserts the broken
   `?child=a` href today and must be updated to the fixed expectation.
6. **Picker preserves other params** — with `window.location` at
   `/es/dashboard/parent/progress?tab=tasks`, changing the select pushes a URL that still
   has `tab=tasks` and now has the new `studentId`.
7. **Deterministic order** — `loadChildrenSummariesForStudentIds` returns children
   alphabetically regardless of the order of the ids passed in.

## Done when

1. Selecting a child, then navigating by sidebar, tab bar or breadcrumb, keeps that child.
2. The home and the payments page agree on the parameter; the two crossed links work.
3. An old `?child=` bookmark still resolves on the home.
4. With no parameter at all, every family screen defaults to the same child.
5. A parent with several children can switch child from the PWA home.
6. Switching child on the progress page keeps the active tab.
7. The student portal is unaffected: its hrefs gain no query string.
8. No migrations.

## Out of scope

- **Consolidating the two pickers visually.** `ParentChildSwitcher` is a row of chips,
  `ParentWardPicker` is a select. Behavior is unified here; making them one component is
  a visual change to the home, which spec 7 is already reworking. Doing it here would mean
  redesigning the home twice. F02's inconsistency is therefore only half closed by this
  spec, and the program document records that.
- Persisting the choice across sessions.
- A "primary child" concept in the database.
- The teacher and admin portals, which have their own student selection.
- `/parent/billing` forwarding a student to `/payments` — it redirects with no student
  today and belongs with the routing work in spec 6.

## Manual QA (parent with 2+ children)

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. Home, pick the second child, then click Progreso, Pagos, Asistencias and Mensajes in
   the sidebar. The second child stays selected everywhere.
2. Same at 390 px wide using the bottom tab bar.
3. On the PWA home, confirm the child switcher is visible and works.
4. Progreso, open the Tareas tab, switch child: the Tareas tab stays open.
5. Open an old `/dashboard/parent?child=<id>` link: it still lands on that child.
6. Log in as a student and confirm no `?studentId=` appears in the menu links.
