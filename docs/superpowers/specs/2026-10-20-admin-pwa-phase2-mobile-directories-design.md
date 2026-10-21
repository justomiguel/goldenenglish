# Phase 2: Mobile Directories & Lists (Students, Parents, Teachers, Users)

**Date:** 2026-10-20
**Status:** Draft (awaiting user approval — Gate 0)
**Program:** [`2026-10-20-admin-pwa-mobile-overhaul-program-design.md`](2026-10-20-admin-pwa-mobile-overhaul-program-design.md) — Phase 2 of 4
**Depends on:** Phase 1 (`2026-10-20-admin-pwa-phase1-shell-and-header-design.md`)
**Closes:** D05, D06

---

## 1. Intent

Replace the mobile directory clutter on `/dashboard/admin/students`, `/parents`, `/teachers`, and `/users` with a fast, high-density mobile directory UX:
1. A compact 1-row mobile search + filter/sort bar backed by a bottom sheet (`Modal`).
2. A contextual floating bulk-action bar that appears only when rows are selected.
3. A scannable 2-line mobile row card (`AdminUsersPwaListItem`) that shows 4–5 people per screen instead of 1.5.

---

## 2. Context & Current Defects

1. **Inline sort-chip wall (`D05`)**:
   - `src/components/pwa/molecules/AdminUsersPwaList.tsx` renders up to 9 sort buttons (`STUDENT_SORT_KEYS`: `name`, `email`, `phone`, `dni`, `sections`, `monthlyDue`, `monthlyQuota`, `enrollmentFee`, `lastEnrollment`) inline above the list. On a `390px` screen, these wrap across 3–4 rows (`~190px` tall).
2. **Always-visible bulk buttons & inline filter stack (`D05`)**:
   - `src/components/dashboard/AdminUsersToolbar.tsx` stacks search, filter toggle, `Exportar a Excel`, `Seleccionar todos`, and `Eliminar seleccionados (0)` vertically, plus a 4-select collapsible box (`sectionId`, `quotaStatus`, `enrollmentFeeStatus`, `courseId`).
   - `AdminUsersPwaList.tsx` also renders a full-width `selectAllPage` checkbox box even when no selection mode is active.
3. **"Bed-sheet" person cards (`D06`)**:
   - `src/components/pwa/molecules/AdminUsersPwaListItem.tsx` (`236` lines) renders up to 7 horizontal `justify-between` metadata rows (`Secciones`, `Cuota mensual`, `Estado cuota`, `Matrícula`, `Última inscripción`, `Padre/Tutor`) plus 3 icon buttons (`Ver`, `Editar`, `Eliminar`). Each card is `~260px` tall.

---

## 3. Architecture & Component Specifications

### 3.1 Mobile Search, Filter & Sort Bar (`AdminUsersMobileToolbar`)

- **Path:** `src/components/pwa/molecules/AdminUsersMobileToolbar.tsx` (`< 160` lines, `'use client'`).
- **Used by:** `AdminUsersScreenNarrow.tsx` (while `AdminUsersDesktopTable` continues using `AdminUsersToolbar.tsx` on `web-desktop`).
- **Tour Anchor:** Preserves `data-tour={ADMIN_TOUR_ANCHORS.usersToolbar}` on its root container.
- **Layout:**
  - **Row 1 (Search + Triggers):**
    - Search input (`flex-1 min-h-11 rounded-xl pl-9 pr-3 text-sm`).
    - **Filters button** (shown when `directoryFilters` is provided): `min-h-11 px-3 rounded-xl border` with `SlidersHorizontal` icon (`h-4 w-4`) + active filter count badge (`activeFilterCount > 0`). Opens the Filter & Sort bottom sheet on the Filters section.
    - **Sort button**: `min-h-11 px-3 rounded-xl border` with `ArrowUpDown` icon (`h-4 w-4`) + short current sort label + direction arrow (`↑`/`↓`). Opens the Filter & Sort bottom sheet on the Sort section.
  - **Row 2 (Compact Status & Secondary Actions Bar):**
    - Left: Total / filtered count (`text-xs text-[var(--color-muted-foreground)]`) + inline `Select page` checkbox toggle (`min-h-9`).
    - Right: Compact `Exportar` button (`Download` icon, `min-h-9 px-2.5 text-xs`) and active filter chips (dismissible pills with `X` icon when any directory filter is active).

### 3.2 Filter & Sort Bottom Sheet (`AdminUsersFilterSortSheet`)

- **Path:** `src/components/pwa/molecules/AdminUsersFilterSortSheet.tsx` (`< 190` lines, `'use client'`).
- **Primitive:** Uses the canonical `Modal` (`src/components/atoms/Modal.tsx`) so focus trapping, `Escape`, backdrop click, and Driver.js tour stacking (`stackBelowTour`) work automatically.
- **Sections inside the Sheet:**
  1. **Sort section (`Ordenar por`)**:
     - Radio-like list of the available sort keys for the current `listMode` (`STUDENT_SORT_KEYS`, `PARENT_SORT_KEYS`, `TEACHER_SORT_KEYS`, or `ALL_SORT_KEYS`).
     - Tapping the active key toggles `asc` / `desc`; tapping a different key selects it (`asc`) and offers an explicit `Ascendente` / `Descendente` segmented toggle at the top of the sort section.
  2. **Directory Filters section (`Filtros`)** (when `directoryFilters` is present for students/parents):
     - Section select (`sectionId`)
     - Monthly quota status select (`quotaStatus`)
     - Enrollment fee status select (`enrollmentFeeStatus`)
     - Course select (`courseId`, when `showCourseFilter` is true)
  3. **Footer actions:**
     - `clearFilters` button (`RotateCcw` icon) when `hasActiveFilters` is true.
     - Primary `done` / `apply` button (`Check` icon) that closes the modal.

### 3.3 Contextual Floating Bulk Action Bar (`AdminUsersBulkBarMobile`)

- **Path:** `src/components/pwa/molecules/AdminUsersBulkBarMobile.tsx` (`< 110` lines, `'use client'`).
- **Visibility:** Rendered only when `selectedCount > 0`.
- **Position:** Sticky/floating bar above `AdminPwaTabBar`:
  `fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 flex items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-lg`
- **Controls:**
  - Left: Selected count badge + `selectAllPage` / `clearSelection` toggle button (`CheckSquare` / `Square` icon, `min-h-11`).
  - Right:
    - `Bulk email` button (`Mail` icon, `min-h-11`) when `bulkMail` is enabled on the `/parents` directory.
    - `Delete selected` destructive button (`Trash2` icon, `min-h-11`, neutral surface with `border-[var(--color-error)] text-[var(--color-error)]` per `01-design-system.mdc` & `26-accessibility-contrast.mdc`).

### 3.4 Compact Scannable `AdminUsersPwaListItem` (`D06`)

- **Path:** `src/components/pwa/molecules/AdminUsersPwaListItem.tsx` (`< 210` lines, `'use client'`).
- **Target Height:** `~96px–116px` per card (down from `~260px`), allowing 4–5 rows visible per viewport.
- **Card Anatomy:**
  1. **Left column:**
     - Checkbox (`h-5 w-5`, `min-h-11 min-w-11` tap area) for bulk selection.
  2. **Center column (`min-w-0 flex-1`):**
     - **Line 1 (Primary Identity + Role/Status Pill):**
       - Tappable full name (`formatProfileNameSurnameFirst`, `font-semibold text-sm text-[var(--color-primary)] truncate`) linking to `/${locale}/dashboard/admin/users/${u.id}` (when `showViewDetails`).
       - Right-aligned primary status pill:
         - In `students` mode: `QuotaStatusBadge` (paid / pending / overdue / no_ charge) + monthly amount (`$...`) if present.
         - In `parents` mode: Children count pill (`N hijos`) + `QuotaStatusBadge`.
         - In `teachers` / `all` mode: Role badge (`Alumno`, `Padre/Tutor`, `Profesor`, `Admin`).
     - **Line 2 (Compact Metadata Summary with `·` separators):**
       - In `students` mode: Section name(s) (`truncate`) · Guardian name (if minor/linked) · DNI/Phone fallback.
       - In `parents` mode: Linked children names (`truncate`) · Phone/Email.
       - In `teachers` mode: Assigned sections (`truncate`) · Phone/Email.
       - In `all` mode: Email (`truncate`) · DNI/Phone.
     - **Line 3 (Optional Secondary Alert Badge — only when actionable):**
       - Shown only if `enrollmentFeeStatus` is `pending` or `unpaid`, or if student has no section assigned (`EnrollmentFeeCells` compact pill).
  3. **Right column (Quick Actions):**
     - Primary tap target: `Link` to detail (`ChevronRight` or `Eye` icon, `min-h-11 min-w-11`) plus a compact `MoreVertical` (`⋯`) or inline `Pencil` / `Trash2` action trigger (`min-h-11 min-w-11`) so admins can edit or delete without vertical clutter.
     - To keep existing tests and 1-tap ergonomics simple: render compact `Eye` (link), `Pencil` (edit), and `Trash2` (delete) icon buttons in a horizontal `flex items-center gap-1` cluster in the top-right header of the card (`h-10 w-10` touch targets), eliminating the separate bottom action bar row.

### 3.5 `AdminUsersPwaList` Simplification

- **Path:** `src/components/pwa/molecules/AdminUsersPwaList.tsx` (`< 160` lines).
- **Changes:**
  - Remove the inline `sortKeys.map(...)` 9-button wall from `AdminUsersPwaList.tsx`.
  - Keep `data-tour={ADMIN_TOUR_ANCHORS.usersTable}` on the list wrapper so screen tours highlight the user list on mobile as well as desktop.
  - Render `AdminUsersPwaListItem` rows and `TablePagination` at the bottom, plus `AdminUsersBulkBarMobile` when `selectedIds.size > 0`.

---

## 4. Dictionary Keys (`src/dictionaries/{en,es,pt}.json`)

Add under `admin.users`:

| Key | `es` (es-419 tuteo) | `en` (ASD-STE100) | `pt` |
|-----|---------------------|-------------------|------|
| `mobileSortButton` | Ordenar: {{field}} | Sort: {{field}} | Ordenar: {{field}} |
| `mobileFilterSortTitle` | Filtrar y ordenar | Filter and sort | Filtrar e ordenar |
| `mobileSortSectionTitle` | Ordenar lista por | Sort list by | Ordenar lista por |
| `mobileSortAsc` | Ascendente (A–Z / menor a mayor) | Ascending (A–Z / low to high) | Ascendente (A–Z / menor para maior) |
| `mobileSortDesc` | Descendente (Z–A / mayor a menor) | Descending (Z–A / high to low) | Descendente (Z–A / maior para menor) |
| `mobileApplyFilters` | Ver resultados | Show results | Ver resultados |
| `mobileClearSelection` | Quitar selección | Clear selection | Limpar seleção |
| `mobileSelectedCount` | {{count}} seleccionados | {{count}} selected | {{count}} selecionados |

---

## 5. Tour Anchors & Invariants (`33-admin-tutorials-contract.mdc`)

| Anchor | Component | Phase 2 Status |
|--------|-----------|----------------|
| `admin-users-subnav` | `AdminSectionSubnav` | Unchanged. |
| `admin-users-title` | `AdminPageHeader` | Unchanged. |
| `admin-users-nav-add` | `AdminCreateUserModalTrigger` | Unchanged. |
| `admin-users-toolbar` | `AdminUsersToolbar` (desktop) & `AdminUsersMobileToolbar` (mobile) | Present on both surfaces. |
| `admin-users-table` | `AdminUsersDesktopTable` (desktop) & `AdminUsersPwaList` (mobile) | Present on both surfaces (`data-tour="admin-users-table"` added to mobile list wrapper). |

---

## 6. Testing Plan (TDD & Self-Contained)

1. **`src/__tests__/components/AdminUsersMobileToolbar.test.tsx` (New)**:
   - Verifies search debounce, opening the Filter & Sort sheet, displaying active filter count badge, and current sort label.
2. **`src/__tests__/components/AdminUsersFilterSortSheet.test.tsx` (New)**:
   - Verifies selecting a sort key calls `onToggleSort`, changing directory filters calls `directoryFilters.onChange`, and `clearFilters` resets filters.
3. **`src/__tests__/components/AdminUsersPwaListItem.test.tsx` (New)**:
   - Verifies compact rendering across `students`, `parents`, `teachers`, and `all` modes, surname-first display (`formatProfileNameSurnameFirst`), detail link, edit/delete callbacks, and checkbox selection.
4. **`src/__tests__/components/AdminUsersBulkBarMobile.test.tsx` (New)**:
   - Verifies the floating bar hides when `selectedCount === 0`, appears when `selectedCount > 0`, and triggers bulk delete / bulk mail / clear selection.

---

## 7. Definition of Done

1. The 9-button inline sort wall is removed from mobile user directories and replaced by `AdminUsersFilterSortSheet`.
2. Bulk actions (`Delete selected`, `Bulk mail`) appear in a floating bottom bar only when at least 1 row is selected.
3. `AdminUsersPwaListItem` renders in a compact 2-line layout (`<= 116px` typical height) across all 4 role directories.
4. Both `admin-users-toolbar` and `admin-users-table` `data-tour` attributes exist on mobile and desktop.
5. All unit tests, dictionary parity tests, typechecks, and lint checks pass.
6. Every touched file is `<= 250` lines.

---

## 8. Manual QA (User-Owned)

1. Open `/es/dashboard/admin/students` on a `390×844` viewport: confirm the search bar, `Filtros`, and `Ordenar` buttons sit on one compact row.
2. Tap `Ordenar`: confirm the bottom sheet opens, changes sort order, and closes cleanly.
3. Select two students via checkboxes: confirm the floating bulk action bar appears above the bottom tab bar with selected count and `Eliminar`.
4. Check `/es/dashboard/admin/parents`, `/teachers`, and `/users` at `390×844`: confirm each card is compact and scannable.
