# New cohort — name, matrícula, copy

**Intent:** The new-cohort dialog asks for the name, whether the cohort charges a matrícula, and that amount. It can also copy sections from another cohort, and then copy that cohort's students into the new sections.

**Done when:**

- The dialog no longer asks for a slug. The server still stores a slug derived from the name.
- Fields are: name, matrícula checkbox, matrícula amount (only when that checkbox is on), unified section-fee checkbox, section-fee amount (only when that checkbox is on), copy-sections checkbox, source cohort (only when copy is on), copy-students checkbox (only when a source is chosen).
- Matrícula off stores `default_enrollment_fee_amount` null. Matrícula on requires an amount of 0 or more and stores it there.
- The unified section fee is `default_monthly_fee`. Off stores null. On requires an amount of 0 or more. Sections inherit that amount until a section sets its own fee plan. Trial and fee mode stay off this dialog.
- Copy sections creates the same non-archived sections (name, teacher, schedule, capacity) on the new cohort. Dates follow the existing copy rule.
- Copy students runs only with a source cohort. Each active student stays active in the source cohort and is also enrolled in the matching new section.
- Each failure has its own code and sentence in `en.json`, `es.json`, and `pt.json`. The log uses the same code.
- The create-cohort tour still finds the name field and the submit button. Step copy no longer mentions the slug.

**Out of scope:** Editing fees after create. Removing the copy-sections dialog on an existing cohort. Payments, scholarships, attendance, and grades.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). The dialog opens from `AcademicHubToolbar` on the academic hub. No `src/components/pwa/` caller uses it.

## Current behavior

`AcademicNewCohortModal` asks for name and optional slug, then `createAcademicCohortAction` inserts the row and opens the new cohort.

`AcademicCopySectionsModal` on an existing cohort calls `copyCohortSectionStructureAction`. With students on, that action closes each source enrollment as transferred and recreates it on the new section. The student leaves the model cohort.

## Decision

1. Extend create so one submit writes the cohort, the matrícula amount, and the optional copy.
2. Pass active cohort choices into the dialog from the hub page.
3. Reuse the section-copy path for structure. Copy students. Do not close the source enrollment.
4. Replace the single `error` sentence on this dialog with one sentence per code.

## Decision on students

Cohorts are different time spans. A student does not leave a cohort when a new year is created.

- A move between sections stays inside one cohort. The old enrollment closes.
- A copy from one cohort to another adds an enrollment. The source enrollment stays active.
- Schedule overlap is checked only against other active sections in the same cohort. The same weekday and hour in another cohort is not a conflict.

`copyCohortSectionStructureAction` copies students. It does not mark the source enrollment transferred. The existing copy dialog uses the same action, so its copy matches this rule.

`rolloverEnrollStudentsAction` moves a student when the destination section is in the same cohort. It copies the student when the destination section is in another cohort. The source enrollment stays active in that case.

## Files

- `src/components/organisms/AcademicNewCohortModal.tsx`
- `src/components/organisms/AcademicHubToolbar.tsx`
- `src/app/[locale]/dashboard/admin/academic/page.tsx`
- `src/app/[locale]/dashboard/admin/academic/cohortActions.ts`
- `src/app/[locale]/dashboard/admin/academic/copyCohortSectionsActions.ts` (only if the chosen student behavior needs a new path)
- `src/dictionaries/en.json`, `es.json`, `pt.json`
- Tests for the dialog and the create action
- Create-cohort tour copy if a step still names the slug

## Manual QA (user)

Open New cohort. Create one with matrícula off. Create one with an amount. Create one that copies sections only. Create one that also copies students, and check the model cohort roster matches the chosen behavior.
