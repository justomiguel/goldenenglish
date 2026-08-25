# Mini 02 — Academic bodies

**Parent:** [`../2026-08-22-admin-experience-unification-design.md`](../2026-08-22-admin-experience-unification-design.md)
**Needs:** Mini 00

## Intent

Cohort detail, section workspace, contents repository, and attendance sit on the same white cards as Alumnos. The section name editor stays an identity `h1`.

## Done when

- Cohort detail tabs/board/cards use the body-card classes.
- Section workspace panels (roster, enroll, fees, teachers, health, assessments) use body-card classes, not `bg-surface` + old radius.
- Contents repository items sit in `rounded-2xl` white cards; view CTA stays primary.
- Attendance admin header already uses `AdminPageHeader`; body card matches.

## Out of scope

Changing tab IA, enrollment RPCs, or the name-editor save flow.

## Files (indicative)

- `AcademicCohortDetailShell.tsx`
- `AcademicSectionPageShellBody.tsx` and panel organisms under `src/components/organisms/AcademicSection*.tsx`
- `AdminGlobalContentRepositoryList.tsx`
- `AdminLearningRoutesGrid.tsx`
