# ADR: Public Registration Cohort, DNI-First Intake, and Student History Audit

**Date:** 2026-10-27
**Status:** Accepted

## Context

1. Public registration (`/register`) and admin registration creation (`AdminRegistrationCreateButton`) previously loaded sections only from the cohort marked `is_current = true`. Institutes need to open next-year registrations while the current cohort is still running.
2. On `/register` and `/i/[token]`, Step 1 required first name, last name, birth date, and document before looking up the student, and then set `readOnly={step !== "student"}`. Families could not edit prior fields after pressing Continue, and existing students were not pre-filled from their document first.
3. Staff need a student history view on the student profile (`AdminUserProfileFicha`) that shows all cohorts and sections the student attended, plus a chronological audit trail of profile edits, tutor changes (previous tutor to new tutor), and section movements.

## Decision

1. **Public registration cohort setting (`site_settings.registration_cohort_id`):**
   - Store the selected public registration cohort UUID under `site_settings.key = 'registration_cohort_id'`.
   - Add `public.resolve_public_registration_cohort_id() RETURNS uuid` (`STABLE SECURITY DEFINER`, `search_path = public`). It returns the configured non-archived cohort ID when valid, or falls back to the non-archived `is_current = true` cohort ID.
   - Update `list_registration_section_picker_options(p_cohort_id uuid DEFAULT NULL)`, `list_registration_section_options()`, `registration_public_section_label(uuid)`, and `registration_public_section_has_open_seat(uuid)` to use `COALESCE(p_cohort_id, public.resolve_public_registration_cohort_id())` (and allow any non-archived cohort section when called by an authenticated admin or for the configured public cohort).
   - Expose the cohort selector in both `/dashboard/admin/settings` (`InscriptionsSettingsForm`) and `/dashboard/admin/registrations` (`AdminRegistrationCohortBar`), plus a cohort selector inside `AdminRegistrationCreateButton`.
2. **DNI-first registration step and editable prefill:**
   - Extend `public.lookup_registration_student(p_dni text)` to return `found`, `first_name`, `last_name`, `birth_date`, `phone`, `email` (blank when synthetic), and the primary linked tutor fields (`tutor_name`, `tutor_dni`, `tutor_email`, `tutor_phone`, `tutor_relationship`).
   - Change `RegisterForm` so Step 1 collects only the document (`dni`) and runs the lookup. Step 2 renders student and tutor/contact fields pre-filled and always editable (`readOnly={false}`).
   - When `acceptRegistrationLead` runs for an existing student (`reuseStudent = true`), reuse the existing `studentId`, apply any modified student profile fields and tutor link updates, record `audit_events`, and enroll the student in the requested sections.
3. **Student history and audit trail (`Historial` tab):**
   - Record structured `audit_events` (`resource_id = studentId`) with `before_values` and `after_values` when staff or registration acceptance updates student profile fields, links/unlinks tutors, or adds/removes/transfers section enrollments.
   - Add the `"history"` tab to `AdminUserProfileFicha` (`AdminUserHistoryPanel`), backed by `loadAdminStudentHistory`, showing the student's cohort/section trajectory and chronological audit events.

## Options Considered

- **Switch `academic_cohorts.is_current` early for next-year registrations:** Rejected. Changing `is_current` switches active teacher dashboards, attendance matrices, and current student billing while the current academic year is still in progress.
- **Keep Step 1 with all four student fields and unlock `readOnly`:** Rejected. Asking for the document first avoids redundant typing for returning students and enables immediate prefill of student and tutor data.
- **Show student history only in the global `/dashboard/admin/audit` table:** Rejected. Staff reviewing a student need cohort trajectory and tutor/profile changes in one place inside the student profile.

## Consequences

- **Positive:** Institutes can accept next-year web registrations without disrupting the current school year. Returning families only enter their document in Step 1, see pre-filled data they can edit or confirm, and never create duplicate student accounts. Staff get full traceability per student.
- **Risks & Mitigations:** Public lookup by DNI returns contact prefill data for matched students. Synthetic internal emails are stripped in SQL, internal UUIDs are never returned, and non-student profiles return `found = false`.
- **Observability & Tests:** Mutations emit `audit_events` (`identity` and `academic` domains) and `system_config_audit` (`registration_cohort_id`). Covered by self-contained Vitest unit and component tests.
