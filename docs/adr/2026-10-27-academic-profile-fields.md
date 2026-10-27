# Academic profile custom fields

## Context

An institute needs extra academic facts on a student. Those facts must stay out of the student and parent portals. Some of them must become columns and filters on the Alumnos list. Event form fields belong to event registration, so they are the wrong table.

## Decision

Add `academic_profile_fields` for the institute definition and `academic_profile_field_values` for one value per student. Archive a field instead of deleting it. File and image cannot be a directory column. Admin defines fields. Admin, the section lead, or a listed assistant edits a value when the student is enrolled in that section.

## Options considered

Store the fields as JSON on `profiles`. Rejected. The Alumnos filter is a paginated directory, and a JSON blob makes that filter fragile.

Reuse `event_form_fields`. Rejected. Those rows belong to an event registration flow and their RLS assumes a public form.

## Consequences

- Additive migration `228_academic_profile_fields.sql`. No backfill.
- RLS hides the rows from students, parents, and tutors.
- Admin field changes use `recordSystemAudit`. Value saves use `auditAcademicProfileStaffAction` because a teacher is not an admin.
- Audit payloads omit the value text, number, date, and file path.
- Vitest covers the pure rules, the directory match, the access check, and the actions.
