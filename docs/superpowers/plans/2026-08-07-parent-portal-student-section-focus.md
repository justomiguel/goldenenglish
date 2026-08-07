# Parent Portal Student + Academic Section Focus — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parents set a URL focus (`studentId` + `sectionId`) once via shell chrome (PWA selects / desktop sidebar chips) and see the whole family portal filtered to that child and academic section.

**Architecture:** Pure focus resolution + URL helper; layout loads linked students and active enrollments; shell-owned `ParentFocusSwitcher` (PWA Home prominent / sticky elsewhere; desktop sidebar chips); pages drop local ward pickers and filter data by resolved focus. Extends `withStudentIdHref` persistence from the 2026-08-06 active-student spec.

**Tech Stack:** Next.js App Router, React client shell, Supabase (`tutor_student_rel`, `section_enrollments`, `academic_sections`), Vitest + RTL, i18n JSON dictionaries.

**Spec:** [`docs/superpowers/specs/2026-08-07-parent-portal-student-section-focus-design.md`](../specs/2026-08-07-parent-portal-student-section-focus-design.md)

## Global Constraints

- No Supabase migrations.
- **Academic section** = active `section_enrollments` row → `academic_sections`. Do not confuse with Progress content panels (tasks/assessments/feedback/badges).
- Focus lives only in URL (`studentId`, `sectionId`). No cookie / localStorage for focus.
- Students sorted alphabetically by `displayName` (existing `listTutorStudentsWithFinance` order). Sections for a student: stable order by `classLabel` then `sectionId`.
- Changing child resets `sectionId` to that child’s first active section (or omits param if none).
- Single child / single section → label only (no select/chips switcher). Zero sections → “no active section” copy.
- All user-visible copy in `src/dictionaries/{en,es,pt}.json` under `dashboard.parent.focus.*`.
- Tier A surfaces: separate PWA vs desktop trees when interaction differs (`useAppSurface` / existing shell split).
- Do not change Progress content-panel picker behavior.
- Student portal may share shell components; only mount focus switcher when `profiles.role === "parent"` (parent layout loads focus options; student layout does not pass them).
- Tests: `npx vitest run <path>`. Prefers self-contained unit/RTL tests. Commits run full precommit (slow).
- Work on an isolated branch/worktree; do not mix with unrelated WIP on `main`.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/parent/parentFocusTypes.ts` | Shared types for focus options / resolved focus |
| `src/lib/parent/resolveParentFocus.ts` | Pure resolution from students + sections + search params |
| `src/lib/parent/withParentFocusHref.ts` | Append both query params; `withStudentIdHref` delegates |
| `src/lib/parent/loadParentFocusCatalog.ts` | Load wards + active sections with class labels for a tutor |
| `src/components/parent/ParentFocusSwitcher.tsx` | Client switcher; surface variants |
| `src/components/parent/ParentFocusSwitcherDesktop.tsx` | Sidebar chips |
| `src/components/parent/ParentFocusSwitcherPwa.tsx` | Selects / labels; `variant: "home" \| "sticky"` |
| Parent layout + shell + sidebar + PWA tab bar | Wire catalog + switcher + href helper |
| Parent pages (home, calendar, progress, payments, messages) | Filter by focus; remove local ward pickers |

---

### Task 1: Types + `resolveParentFocus` (TDD)

**Files:**
- Create: `src/lib/parent/parentFocusTypes.ts`
- Create: `src/lib/parent/resolveParentFocus.ts`
- Create: `src/__tests__/lib/parent/resolveParentFocus.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:

```ts
export interface ParentFocusStudentOption {
  studentId: string;
  displayName: string;
}

export interface ParentFocusSectionOption {
  sectionId: string;
  classLabel: string; // e.g. "Teens — A1" (cohort — section name)
}

export interface ParentFocusCatalog {
  students: ParentFocusStudentOption[];
  /** Active sections keyed by studentId; missing key ⇒ no active sections */
  sectionsByStudentId: Record<string, ParentFocusSectionOption[]>;
}

export interface ParentFocusSearchParams {
  studentId?: string | null;
  sectionId?: string | null;
}

export interface ResolvedParentFocus {
  studentId: string | null;
  sectionId: string | null;
  student: ParentFocusStudentOption | null;
  sectionsForStudent: ParentFocusSectionOption[];
  section: ParentFocusSectionOption | null;
}

export function resolveParentFocus(
  catalog: ParentFocusCatalog,
  params: ParentFocusSearchParams,
): ResolvedParentFocus;
```

Rules: empty students → all nulls/empty; invalid/missing `studentId` → first student; invalid/missing `sectionId` → first section of selected student (or null if none).

- [ ] **Step 1: Write failing tests** covering empty catalog, valid pair, invalid student, invalid section, student with zero sections, multi-student default to first.

- [ ] **Step 2:** `npx vitest run src/__tests__/lib/parent/resolveParentFocus.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement types + resolver.**

- [ ] **Step 4:** Re-run tests → PASS.

- [ ] **Step 5: Commit** `feat(parent): resolve student+section focus from search params`

---

### Task 2: `withParentFocusHref` + migrate `withStudentIdHref`

**Files:**
- Create: `src/lib/parent/withParentFocusHref.ts`
- Modify: `src/lib/parent/withStudentIdHref.ts` (delegate when only student needed)
- Create: `src/__tests__/lib/parent/withParentFocusHref.test.ts`
- Modify: `src/__tests__/lib/parent/withStudentIdHref.test.ts` (keep existing behavior)

**Interfaces:**
- Consumes: Task 1 types (ids only).
- Produces:

```ts
export function withParentFocusHref(
  href: string,
  focus: { studentId: string | null; sectionId: string | null },
): string;
```

Behavior: set `studentId` / `sectionId` when non-empty **unless** that key already exists on `href` (same “do not overwrite” rule as today). Preserve other params (`tab`, etc.). Empty student clears neither existing foreign params; empty section omits `sectionId`.

- [ ] **Step 1: Failing tests** — bare path, preserves `tab`, both params, does not overwrite existing `studentId`/`sectionId`, nulls leave href unchanged or only set present ids.

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: Implement.** Optionally make `withStudentIdHref(href, id)` call `withParentFocusHref(href, { studentId: id, sectionId: null })`.

- [ ] **Step 4:** Run both test files → PASS.

- [ ] **Step 5: Commit** `feat(parent): withParentFocusHref for studentId+sectionId`

---

### Task 3: Load focus catalog + i18n

**Files:**
- Create: `src/lib/parent/loadParentFocusCatalog.ts`
- Create: `src/__tests__/lib/parent/loadParentFocusCatalog.test.ts` (mock Supabase client)
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json` — add `dashboard.parent.focus`:

```json
"focus": {
  "childLabel": "Child",
  "sectionLabel": "Class",
  "childSelectAria": "Select child",
  "sectionSelectAria": "Select class",
  "noActiveSection": "No active class",
  "focusBarAria": "Family focus"
}
```

(es/pt equivalents; es voseo where applicable.)

**Interfaces:**
- Consumes: `ParentFocusCatalog` types; `listTutorStudentsWithFinance` pattern.
- Produces:

```ts
export async function loadParentFocusCatalog(
  supabase: SupabaseClient,
  tutorId: string,
  locale: string,
): Promise<ParentFocusCatalog>;
```

Load active enrollments for linked student ids; join `academic_sections(name)` + `academic_cohorts(name)`; build `classLabel` as `${cohort} — ${section}` when cohort present (same as hub logistics).

- [ ] **Step 1: Dictionary keys + failing loader test** (mocked empty / one student two sections).

- [ ] **Step 2:** Implement loader.

- [ ] **Step 3:** Tests + typecheck dictionaries → PASS.

- [ ] **Step 4: Commit** `feat(parent): load focus catalog and i18n labels`

---

### Task 4: `ParentFocusSwitcher` UI (PWA + desktop)

**Files:**
- Create: `src/components/parent/ParentFocusSwitcher.tsx`
- Create: `src/components/parent/ParentFocusSwitcherPwa.tsx`
- Create: `src/components/parent/ParentFocusSwitcherDesktop.tsx`
- Create: `src/__tests__/components/parent/ParentFocusSwitcher.test.tsx`

**Interfaces:**
- Consumes: catalog, resolved focus, `Dictionary["dashboard"]["parent"]["focus"]`, `useRouter`/`usePathname`/`useSearchParams`.
- Produces: client component that on change navigates via `withParentFocusHref` on current path; changing student sets that student’s first section.

Props sketch:

```ts
type ParentFocusSwitcherProps = {
  catalog: ParentFocusCatalog;
  focus: ResolvedParentFocus;
  labels: Dictionary["dashboard"]["parent"]["focus"];
  variant: "desktop-sidebar" | "pwa-home" | "pwa-sticky";
};
```

- Desktop: chip lists above nav; labels when count ≤ 1.
- PWA home: prominent stacked selects/labels.
- PWA sticky: compact bar.

- [ ] **Step 1: RTL tests** — 2 students → selects/chips; 1 student 1 section → labels; 0 sections → noActiveSection; student change updates URL with new sectionId.

- [ ] **Step 2: Implement components.**

- [ ] **Step 3:** Tests PASS.

- [ ] **Step 4: Commit** `feat(parent): ParentFocusSwitcher for PWA and desktop`

---

### Task 5: Wire layout, shell, nav, tab bar

**Files:**
- Modify: `src/app/[locale]/dashboard/parent/layout.tsx` — load catalog; pass to shell (layout cannot read page searchParams in all Next versions — pass catalog only; client switcher + pages resolve from URL).
- Modify: `src/components/dashboard/ParentDashboardShell.tsx` + `ParentDashboardShellClient.tsx` — accept optional `focusCatalog` + `focusLabels`; render desktop switcher in sidebar; PWA sticky bar (except home uses prominent mount from home entry OR sticky always + home also shows prominent — prefer: sticky in PWA shell always; home entry adds prominent block and hides sticky duplicate via pathname check).
- Modify: `src/components/dashboard/ParentSidebar.tsx` + `ParentSidebarNavContent.tsx` — render desktop focus chips above nav; use `withParentFocusHref` with both ids from `useSearchParams`.
- Modify: `src/components/pwa/molecules/ParentPwaTabBar.tsx` — `withParentFocusHref`.
- Modify: `src/components/pwa/organisms/ParentPwaShell.tsx` — sticky focus bar when catalog present.
- Modify tests for shell/nav that assert hrefs.

**Note:** Next.js root layouts do not receive `searchParams`. Client switcher reads URL; server pages resolve focus independently for data loading.

- [ ] **Step 1: Pass catalog from parent layout into shell.**

- [ ] **Step 2: Nav/tab bar preserve both params.**

- [ ] **Step 3: Mount switcher (desktop sidebar + PWA sticky).**

- [ ] **Step 4: Update shell/nav unit tests; commit** `feat(parent): wire focus catalog into parent shell chrome`

---

### Task 6: Page filtering + remove local ward pickers

**Files (representative; adjust to current page structure):**
- Modify home: `ParentHomeInbox.tsx`, `ParentHomePwaFocus.tsx` — remove `ParentChildSwitcher`; PWA home mounts `variant="pwa-home"` focus switcher; filter pillars/logistics/attendance to `sectionId`.
- Modify calendar / `ParentAttendancePwaScreen` / portal calendar entry — remove `ParentWardPicker`; filter to one section.
- Modify `ParentProgressEntry.tsx` — remove ward picker; filter lists by academic `sectionId` where data has section linkage.
- Modify `ParentPaymentsEntry.tsx` — remove student select; filter rows by section.
- Modify messages entry / teacher resolution — prefer teacher for focused section enrollment.
- Server pages: resolve focus with `resolveParentFocus` + catalog (or lighter student list + sections query already used).

- [ ] **Step 1: Home + calendar.**

- [ ] **Step 2: Progress + payments.**

- [ ] **Step 3: Messages teacher by focused section.**

- [ ] **Step 4: Smoke vitest for affected components; commit** `feat(parent): filter portal pages by student+section focus`

---

### Task 7: Verification sweep

- [ ] **Step 1:** `npx vitest run src/__tests__/lib/parent/resolveParentFocus.test.ts src/__tests__/lib/parent/withParentFocusHref.test.ts src/__tests__/lib/parent/loadParentFocusCatalog.test.ts src/__tests__/components/parent/ParentFocusSwitcher.test.tsx`

- [ ] **Step 2:** Fix any regressions in `ParentSidebarNavContent` / `ParentPwaTabBar` / `ParentDashboardShell` tests.

- [ ] **Step 3:** Manual checklist: multi-child multi-section parent — switcher visible; URL updates; each tab keeps focus; single-child single-section shows labels only.

- [ ] **Step 4: Final commit if needed** for polish only.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| URL `studentId` + `sectionId` | 1, 2, 5 |
| PWA home prominent + sticky elsewhere | 4, 5, 6 |
| Desktop sidebar chips | 4, 5 |
| Labels when single; empty section copy | 1, 4 |
| Child change resets section | 1, 4 |
| Filter home/calendar/progress/payments/messages | 6 |
| Remove local pickers | 6 |
| i18n en/es/pt | 3 |
| Unit + RTL tests | 1–4, 7 |
| No Progress panel picker changes | Out of scope respected |
| No migrations | Global constraint |
