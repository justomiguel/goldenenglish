# Parent portal: global student + academic-section focus

**Date:** 2026-08-07  
**Status:** Approved (brainstorm)  
**Related:**
- [`2026-08-06-parent-active-student-persistence-design.md`](2026-08-06-parent-active-student-persistence-design.md) — `studentId` in URL + nav preservation (extends)
- [`2026-08-07-parent-progress-section-picker-design.md`](2026-08-07-parent-progress-section-picker-design.md) — **unrelated naming**: that spec picks Progress *content* panels (tasks / assessments / feedback / badges), not `academic_sections`

## Intent

A parent (tutor) linked to several wards, or a ward enrolled in several active academic sections, must be able to set a **focus** once and see the whole family portal filtered to that child and that section — without hunting for per-page pickers.

## Decisions

| Topic | Choice |
|-------|--------|
| Where focus lives | URL: `?studentId=` + `?sectionId=` |
| Scope of filter | Entire parent portal for data that belongs to a section |
| PWA UI | Compact selects; **more prominent on Home**; sticky compact bar on other routes |
| Desktop UI | Always-visible chips / list in the **sidebar** (above nav) |
| Single child | Label with the name (no switcher control) |
| Single active section | Label with the section (no switcher control) |
| Zero active sections | Discrete empty copy (“Sin sección activa”); no section control |
| Change child | Reset `sectionId` to that child’s first active section (or clear if none) |
| Invalid / missing params | Fall back: first linked student (alpha by display name, as today) → first active section |
| Local pickers | Remove page-local ward/section pickers that duplicate shell focus |
| Persistence beyond URL | None (no cookie / localStorage for focus) |
| Database | No migrations |

### Naming note

In this document **section** means an `academic_sections` enrollment (`section_enrollments` with `status = 'active'`). It does **not** mean a Progress content panel.

## Architecture

### Focus resolution

New pure helper (name indicative): `resolveParentFocus({ students, sectionsByStudentId, searchParams })`.

Returns `{ studentId, sectionId, student, sectionsForStudent, section }` with the rules above.  
`sectionsByStudentId` comes from active `section_enrollments` joined to section/cohort labels (same labeling used in attendance / logistics today, e.g. cohort — section).

### URL helper

Extend or replace `withStudentIdHref` with `withParentFocusHref(href, { studentId, sectionId })` so sidebar, PWA tab bar, breadcrumbs, and deep links preserve **both** params. Keep a thin wrapper or migration path so existing `withStudentIdHref` call sites either gain `sectionId` or delegate to the new helper.

### Shell-owned switcher

`ParentFocusSwitcher` (name indicative) owns the control; pages consume focus from `searchParams` only.

| Surface | Placement | Control |
|---------|-----------|---------|
| PWA Home | Prominent block near the top of home content | Selects when multiple; labels when single |
| PWA other routes | Sticky bar above page content | Same selects / labels, compact |
| Desktop | Sidebar, above primary nav | Chips / list for children; chips / list for sections of the focused child; labels when single |

Detection via existing `useAppSurface` / `SurfaceMountGate` patterns (Tier A: separate PWA vs desktop trees when interaction differs).

### Data loading

Layout or shell server path loads:

1. Linked students (`tutor_student_rel` → same loaders as today).
2. Active sections per linked student (`section_enrollments` + section/cohort display fields).

Pass options + resolved focus into shell client chrome. Individual RSC pages keep resolving focus from their `searchParams` (and the same helpers) so they can filter queries without relying on client-only state.

### Per-route filter behavior

| Route | Behavior under focus |
|-------|----------------------|
| Home | Pillars, logistics, attendance % for focused student **and** section |
| Calendar / attendance | Single section view (no multi-section card stack) |
| Progress | Tasks, assessments, feedback, badges scoped to that academic section |
| Payments | Rows / fees for that section; clear empty if none |
| Messages | Teacher(s) for that section (not “newest of any enrollment”) |
| Settings / ward profile edit | Not section-scoped; switcher may remain visible for continuity |

### Removal of duplicates

- Home content chips (`ParentChildSwitcher` in home bodies) when shell/sidebar or PWA focus UI already shows them.
- `ParentWardPicker` (and payments inline student `<select>`) on calendar, progress, payments, etc., once shell focus is wired.
- Any multi-section “show all” lists on those screens become single-section under focus (empty states when the focused section has no data).

## Copy (i18n)

Add `dashboard.parent.focus.*` (en / es / pt): labels for child and section, select aria names, “no active section”, and any empty-state lines tied to focus. Prefer short labels suitable for sticky PWA chrome.

## Tests

1. **Unit:** `resolveParentFocus` — missing/invalid student, missing/invalid section, child change resets section, zero sections, single vs multiple.
2. **Unit:** `withParentFocusHref` — preserves both params; drops nothing needed by existing deep links (`tab`, etc.).
3. **RTL:** Focus switcher — 1 child / 1 section → labels; N → controls; desktop chips vs PWA selects via surface gate.
4. **Regression:** Nav / tab bar still carry focus across parent routes; Progress `?tab=` still works alongside `studentId` + `sectionId`.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Confusion with Progress “section” picker | Distinct component names and copy (“Clase” / section label from academics); keep Progress panel picker as-is |
| Payments / messages historically multi-section | Explicit empty states; messages resolve teacher from focused enrollment |
| Shell load cost for all sections of all wards | One batched query keyed by linked student ids; reuse existing enrollment loaders where possible |
| Deep links with only `studentId` | Resolve default section server-side; emit both params on subsequent navigations |

## Out of scope

- Student portal focus switcher (students are themselves).
- Changing Progress content-panel picker (tasks / assessments / feedback / badges).
- Account-level or cross-device remembered focus outside the URL.
- Showing inactive / dropped enrollments in the switcher.
- Redesign of individual page layouts beyond removing duplicate pickers and applying the filter.

## Definition of done

- Parent PWA: prominent Home focus controls; sticky compact controls elsewhere; labels when only one option.
- Parent desktop: sidebar chips/list for child and section; labels when only one option.
- `studentId` + `sectionId` persist across parent nav and filter home, calendar, progress, payments, and messages as specified.
- Page-local ward pickers removed where the shell owns focus.
- en / es / pt copy present; unit + RTL coverage for resolution, href helper, and switcher states.
