# Public registration: preferred section (current cohort)

## Context

The public enrollment form allowed free-text “level of interest”, which did not align with real **academic sections** in the current cohort and was error-prone for downstream course resolution.

## Decision

- Store `preferred_section_id` on `public.registrations` (FK to `academic_sections`), populated from a **select** of sections whose cohort has `is_current = true`, **or** left null when the applicant chooses **“help me choose”** (`REGISTRATION_UNDECIDED_FORM_VALUE` → stable `level_interest` code `REGISTRATION_LEVEL_INTEREST_UNDECIDED`).
- Keep `level_interest` as the **display label** (`cohort — section`) for admin UI and legacy rows; specific sections set it from `registration_public_section_label`.
- Expose `list_registration_section_options()` and `registration_public_section_label(uuid)` as `SECURITY DEFINER` RPCs callable by `anon` for the form and validation.
- Add narrow **RLS** `SELECT` policies for `anon` on **current** cohorts and their sections so FK checks on insert succeed.
- On **accept**, resolve the course id via `resolveCourseIdForRegistrationAccept` (section/cohort names → CEFR, then `courses`), with **fallback** to legacy `level_interest` text. If **no** course id is resolved (undecided, legacy free text, or missing course row), **still create the student** and **skip** legacy `enrollments` insert; admin assigns **section** later (`enrollStudentInSectionAction` and/or skip in the post-accept picker). The admin **Users** list flags students with no active `section_enrollment` (“No section” / “Sin sección”).

## Options considered

- **CEFR-only select** — rejected: product wants the actual section list families see in operations.
- **Only client-side validation** — rejected: server RPC + FK keep tampering from inserting arbitrary section ids.

## Consequences

- Requires migration `029_registrations_preferred_section.sql` applied before relying on the new form.
- If no sections are published yet, applicants can still submit using the undecided option; operations follows up and assigns a section when ready.

## Tests / follow-up

- Vitest: `publicRegistrationSchema`, `submitPublicRegistration`, `RegisterForm`.
- Consider product analytics on successful public registration if the team wants funnel metrics (`08`).
