# Academic Custom Fields in Directory Filter Panel and Sort Menu

## Intent

Move custom academic profile field filters (`acf_<fieldId>`) inside the Alumnos **Filtrar** panel (`AdminDirectoryFilterPanel`) instead of rendering them loose above the table, and include custom academic column fields in the **Ordenar** menu (`AdminUsersSortChecklist` and `AdminUsersSortSheet`).

## Root Cause

1. **Filter placement:** `AdminUsersTableDesktop` and `AdminUsersScreenNarrow` rendered `<AcademicProfileDirectoryFilters />` above the table/list outside `AdminUsersToolbar` / `AdminDirectoryFilterPanel`. In addition, `AdminDirectoryFilterPanel` and `AdminUsersMobileToolbar` only checked built-in `AdminDirectoryFilters` when computing `filtersActive` and `activeFilterCount`, ignoring active `acf_*` parameters.
2. **Sort menu options:** `AdminUsersToolbar` and `AdminUsersMobileToolbar` passed `adminUsersSortKeysForLock(lockRole)` (built-in keys only) to `AdminUsersSortChecklist` and `AdminUsersSortSheet`, without appending `acf:<fieldId>` keys from `sortFieldLabels`. Furthermore, `AdminUsersSortChecklist` rendered `<option>` labels with `adminUsersSortColumnLabel(labels, key)` instead of `fieldLabels?.[key] ?? adminUsersSortColumnLabel(labels, key)`.

## Design

### 1. Filter panel integration (`AdminDirectoryFilterPanel` + `AcademicProfileDirectoryFilters`)

- Remove the standalone `<AcademicProfileDirectoryFilters />` render from `AdminUsersTableDesktop.tsx` and `AdminUsersScreenNarrow.tsx`.
- Pass custom academic filter metadata (`columns`, `selectFacets`, `values`, `emptyLabel`, `onAcademicFieldChange`) through `directoryFilters` into `AdminDirectoryFilterPanel`.
- Render `<AcademicProfileDirectoryFilters />` inside the `<div className="grid gap-3 sm:grid-cols-2">` of `AdminDirectoryFilterPanel` with matching control classes (`min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm`).
- Include active `acf_*` values in `filtersActive` (dot indicator, initial open state, and **Limpiar filtros** button) and in `AdminUsersMobileToolbar` `activeFilterCount`.

### 2. Sort menu integration (`AdminUsersSortChecklist`, `AdminUsersSortSheet`, `adminUsersSortCriteria`)

- Widen `replaceAdminUsersSortKey`, `addAdminUsersSortCriterion`, `AdminUsersSortChecklist`, and `AdminUsersSortSheet` `sortKeys` types from `SortKey` to `AdminDirectorySortKey`.
- In `AdminUsersToolbar` and `AdminUsersMobileToolbar`, append `Object.keys(sortFieldLabels ?? {}) as AdminDirectorySortKey[]` to `adminUsersSortKeysForLock(lockRole)`.
- In `AdminUsersSortChecklist`, use `fieldLabels?.[key] ?? adminUsersSortColumnLabel(labels, key)` when rendering each `<option>` in the `<select>`.

## Surfaces (Web vs PWA)

- **Web (`web-desktop` — `AdminUsersTableDesktop` + `AdminUsersToolbar`):**
  - Custom field filters appear inside the collapsible **Filtrar** panel (`AdminDirectoryFilterPanel`) in the 2-column grid.
  - Custom field columns appear in the collapsible **Ordenar** checklist (`AdminUsersSortChecklist`) dropdown and in **Agregar criterio**.
- **PWA / Mobile (`web-mobile` / `pwa-mobile` — `AdminUsersScreenNarrow` + `AdminUsersMobileToolbar`):**
  - Custom field filters appear inside `AdminUsersFilterSortSheet` (which wraps `AdminDirectoryFilterPanel`), and active `acf_*` filters increment the badge count on the mobile **Filtrar** button.
  - Custom field columns appear inside `AdminUsersSortSheet` (which wraps `AdminUsersSortChecklist`).

## Done When

- Custom academic field filters render inside the **Filtrar** panel on desktop and inside the filter sheet on mobile/PWA, not outside the table.
- Active custom field filters activate the filter indicator dot, mobile badge count, and **Limpiar filtros** action.
- Custom academic column fields appear as selectable options in the **Ordenar** menu on desktop and mobile/PWA.
- Self-contained Vitest tests cover both the filter panel integration and the sort menu options.

## Out of Scope

- Changing server-side filter or sort query semantics (already implemented in `applyAcademicProfileDirectoryFilter` and `academicDirectorySort`).
- Adding custom academic fields to non-student directories (`teachers`, `parents`, unlocked users).
