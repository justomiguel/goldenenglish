# Academic custom fields in Filter and Sort

Spec: `docs/superpowers/specs/2026-10-28-academic-custom-fields-filter-and-sort-menu-design.md`

## Steps

1. Render `AcademicProfileDirectoryFilters` inside `AdminDirectoryFilterPanel` and remove the standalone mount on desktop and narrow.
2. Count active `acf_*` params in the filter dot, the clear button, and the mobile badge.
3. Append `acf:<uuid>` keys from `sortFieldLabels` to the sort menus and label those options with the field name.
4. Widen sort replace/add types to `AdminDirectorySortKey`.

## Tests

- `AdminDirectoryFilterPanel.test.tsx` — field is inside the panel; an `acf_` param opens the panel and shows the dot.
- `AdminUsersMobileToolbar.test.tsx` — the sort menu lists the field label.
- `adminUsersSortCriteria.test.ts` — add and replace accept an `acf:` key.
