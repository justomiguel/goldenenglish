# Assign web registrations only inside the inscriptions cohort

**Intent:** On admin Inscripciones, section assignment for a web lead offers only sections of the cohort configured for public web inscriptions. If that cohort has no sections, staff see a button that opens section creation for that cohort.

**Done when:**

- The assign dropdown, the propose-schedule dropdown, and the accept-section picker list sections of `registration_cohort_id` (fallback: current cohort, then the first non-archived cohort). They do not list sections of `is_current` when that cohort is different.
- A section outside that cohort cannot be saved from those three paths.
- The create-section button is always visible on assign and on the accept picker, whether the cohort has sections or not. The label includes the cohort name: “Crear sección en {nombre}” / “Create a section in {name}”.
- The button goes to `/{locale}/dashboard/admin/academic/{cohortId}?tab=sections`.
- When that cohort has zero non-archived sections, a short legend says the cohort has no sections, and the select or section rows stay hidden.
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
6. Always show the create-section link next to assign and on the accept picker. The label includes the cohort name. The href includes `?tab=sections`. When the list is empty, hide the select or the section rows and show the legend “Esta cohorte no tiene secciones.” Copy lives in `en.json` and `es.json`.

## Tests

- Pure or loader test: sections query is scoped to the inscriptions cohort id.
- Component test: assign control renders only those sections.
- Component test: zero sections renders the legend and the create link to `?tab=sections`, and does not render the select.
- Component test: when sections exist, the create link still renders and its name includes the cohort.
- Action test: a section from another cohort returns not-ok.
