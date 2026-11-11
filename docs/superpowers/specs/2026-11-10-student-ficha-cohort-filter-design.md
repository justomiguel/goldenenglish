# Student ficha — cohort filter

**Intent:** On the admin student ficha, Académico and Pagos each offer a cohort combo. The combo lists every cohort where that student has an enrollment. The selected cohort drives the sections on Académico and the payments on Pagos.

**Done when:**

- Académico opens on the vigente cohort and still lets staff add or remove sections there.
- Another cohort on Académico shows a read-only list: section name, enrollment status, teacher, and assistants.
- Pagos opens on the same default cohort and limits the section select and the payment rows to that cohort.
- A change of cohort survives a remount of the same ficha. The `tab` query stays the page tab. The cohort uses the query key `cohort`.
- Web desktop and the existing narrow ficha (`AdminUserDetailPwa`) both show the combo.

**Out of scope:** The student self-service dashboard. A historical snapshot of who taught the section in a past year. New tables, new RLS, and a new analytics event. An ADR.

## Context

The ficha opens from the student name. `AdminUserProfileFicha` keeps the page tab in `?tab=` through `usePersistentPageTab`.

Académico renders `AdminStudentCurrentCohortAssignmentCard`. `loadAdminStudentCurrentCohortAssignment` reads only the cohort with `is_current = true`, and only `active` enrollments. Staff can add and remove sections in that cohort.

Pagos renders `AdminStudentBillingClient`. `loadAdminStudentBillingTabData` loads every active enrollment and every payment for the student. The section select mixes cohorts. `AdminStudentBillingSectionBenefit` stores `cohortName` and does not store `cohortId`.

`AdminUserDetailDesktop` and `AdminUserDetailPwa` both render `AdminUserDetailPanel`. The PWA file does not have its own academic or payments tree.

Enrollment status values are `active`, `completed`, `transferred`, and `dropped`.

## Decision

Load the student's enrollments once, in every status. Build one cohort list from those rows. Pass that list into Académico and into Pagos.

Default cohort: the vigente cohort when the student has any enrollment in it. Otherwise the cohort whose latest enrollment `created_at` is newest.

Write the choice to `?cohort=<id>`. Keep the other query keys, including `tab`. An unknown id falls back to the default cohort.

Académico, vigente cohort: keep the current add and remove card.

Académico, any other cohort: read-only rows. Show section name, status, the section's current teacher, and the current assistants. Do not show the add form.

Pagos: the section select and the payment table include only sections of the selected cohort. Include enrollments of every status so a past section still opens. Keep the current payment actions on those sections.

The teacher and the assistants are the people stored on the section today. The ficha does not store who taught that section in a past year.

## Options

1. **One payload, filter in the client, persist `cohort` in the query.** Recommended. The ficha already loads one student's rows. Both tabs share one list and one choice.
2. **Refetch the ficha when the cohort changes.** Rejected. The page already holds this student's enrollments and payments. A second round trip adds delay and a second loader contract.
3. **Two combos with two cohort lists.** Rejected. Académico and Pagos would drift apart.

## Surfaces (Web vs PWA)

Tier B admin screen. A PWA tree exists: `AdminUserDetailPwa` wraps the same `AdminUserDetailPanel` as desktop. There is no separate academic or payments PWA component.

- **Web (`web-desktop`):** The combo sits at the top of the sections card on Académico, and at the top of the payments controls on Pagos, beside the existing section select. The sections card stays in the current two-column academic grid.
- **PWA (`web-mobile` / `pwa-mobile`):** The same panels. The combo is full width and at least 44px tall. It stacks above the section list and above the payments section select. Do not add a sheet. Do not add a second component tree.

Shared props gain a cohort list and `cohortId` on each billing section. Desktop and PWA read those props through the same panel.

## Data

Extend the student detail load:

- Cohort options: `id`, `name`, `isCurrent`.
- Per enrollment in a non-vigente cohort: section name, status, teacher, assistants.
- Billing section benefit: add `cohortId`.

The vigente assignment loader stays the source for add and remove. The history rows come from enrollments whose section belongs to the selected cohort.

Filter payments with a pure function: keep a payment when its `section_id` belongs to a section of the selected cohort. A payment with a null `section_id` stays out of every cohort view.

## Copy

Add labels in `en.json`, `es.json`, and `pt.json` under `admin.users` and `admin.billing`. Spanish uses neutral tuteo. The combo label names the cohort. Each enrollment status has its own short label. Empty cohort copy names the cohort and says there are no sections or no payments.

## Errors

A failed enrollment read returns a stable code, logs `[ge:server]` with scope `loadAdminStudentCohortOptions`, and shows that code with a sentence that says the cohort list did not load. Do not replace every failure with one generic sentence.

## Tests

- Pure filter: cohort list, default cohort, unknown id, payment rows by cohort, null `section_id`.
- Académico: the combo switches the visible sections. The vigente cohort still shows add and remove. Another cohort does not.
- Pagos: the section select lists only the selected cohort.
- The unknown-code path shows the raw code.

## Manual QA (user)

Open one student who has enrollments in two cohorts. Check Académico and Pagos on desktop and on a narrow viewport. Confirm add and remove still work on the vigente cohort only.
