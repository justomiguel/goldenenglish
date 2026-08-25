# Mini 04 — Academic hub

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Mini 00

## Intent

Cohortes y secciones already has a decent header. Bring it onto the kit so it matches Alumnos, and do the same for the contents list (the academic child that is a directory, not a section workspace).

## Done when

- `/admin/academic` uses `AdminPageHeader` with `iconId="academic"` and keeps `AcademicHubToolbar` in `actions`. `data-tour` academic title stays.
- `/admin/academic/contents` list header uses `iconId="contents"`.
- Section workspace (`/academic/[cohortId]/[sectionId]`) keeps its own area chrome; only replace a leftover secondary `h1` if one exists at the cohort index.

## Out of scope

Redesigning the section editor, week schedule, roster tables, or area flags.

## Files

- `src/app/[locale]/dashboard/admin/academic/page.tsx`
- `src/app/[locale]/dashboard/admin/academic/contents/page.tsx`
- `src/app/[locale]/dashboard/admin/academic/[cohortId]/page.tsx` (header only if it is a title page)
