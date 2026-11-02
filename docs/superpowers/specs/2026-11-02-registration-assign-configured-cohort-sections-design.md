# Assign web registrations only inside the inscriptions cohort

**Intent:** On admin Inscripciones, section assignment for a web lead offers only sections of the cohort configured for public web inscriptions. If that cohort has no sections, staff see a button that opens section creation for that cohort.

**Done when:**

- The assign dropdown, the propose-schedule dropdown, and the accept-section picker list sections of `registration_cohort_id` (fallback: current cohort, then the first non-archived cohort). They do not list sections of `is_current` when that cohort is different.
- A section outside that cohort cannot be saved from those three paths.
- When that cohort has zero non-archived sections, those controls show a button labeled “Crear sección en la cohorte” / “Create a section in this cohort”. The button goes to `/{locale}/dashboard/admin/academic/{cohortId}`.
- When the cohort has sections, the create button stays hidden, including when every section is full.
- Web desktop and the existing admin PWA registrations tree share the same section list and the same empty-state button.

**Out of scope:**

- Changing which cohort the public register form uses.
- Creating the section inside the inscriptions modal.
- Moving a student who is already enrolled from the student profile.
- Per-lead historical cohort if an admin later changes `registration_cohort_id`. The live setting wins.

## Surfaces (Web vs PWA)

Admin Inscripciones already has two trees behind `SurfaceMountGate`:

- Web (`web-desktop`): `AdminRegistrationsTableDesktop` plus `AdminRegistrationAcceptSectionPicker` and `AdminRegistrationIntakeActions`.
- PWA (`web-mobile` / `pwa-mobile`): `AdminRegistrationsScreenNarrow` → `AdminRegistrationPwaCard`, which reuses `AdminRegistrationIntakeActions` and the accept form.

Shared data (`currentCohortSections` today) feeds both trees. Replace that payload with sections of the inscriptions cohort so neither tree keeps the old list. The empty-state button uses a `min-h-[44px]` target and a leading Plus icon on both surfaces. Do not add a second section list in the PWA card.

## Behavior

1. Resolve the cohort with `loadRegistrationCohortConfig().activeCohort`.
2. Load non-archived sections for that cohort id (same shape as `CurrentCohortSection`).
3. Pass that list and that cohort name into the registrations screen.
4. Filter assign, propose, and accept pickers to that list.
5. On assign, propose, and the accept enroll call that starts from Inscripciones, reject a `sectionId` whose `academic_sections.cohort_id` is not the active inscriptions cohort. Return a stable error code. Do not change general section enrollment from the student file.
6. Empty list: hide the select or the section rows and show the create-section link. Copy lives in `en.json` and `es.json`. Spanish uses tuteo only if the string is a sentence. The button label is “Crear sección en la cohorte”.

## Tests

- Pure or loader test: sections query is scoped to the inscriptions cohort id.
- Component test: assign control renders only those sections.
- Component test: zero sections renders the create link to the cohort academic page and does not render the select.
- Action test: a section from another cohort returns not-ok.
