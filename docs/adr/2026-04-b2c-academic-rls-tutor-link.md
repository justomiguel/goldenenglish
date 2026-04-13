# ADR: B2C academic visibility via `tutor_student_rel`

## Context

Migration `011` replaced `parent_student` with `tutor_student_rel`. Later academic policies in `017` / `018` still referenced `parent_student`, breaking **SELECT** for guardians on `academic_sections`, `section_enrollments`, and hiding **transfer outcomes** from students and tutors.

## Decision

1. Recreate `academic_sections_select_scope` and `section_enrollments_select_scope` using `tutor_student_rel` for guardian access.
2. Extend `section_transfer_requests_select` so the **student** and any **tutor** linked to that student can read rows (read-only UI for “schedule updated” / parent feed).

## Consequences

- Guardians with `role = parent` and a `tutor_student_rel` row see the same academic rows as before the regression.
- Students see their own transfer request lifecycle; copy should filter to **approved** where product wants “final” notices only.
- Follow-up: replace any remaining `parent_student` references in older migrations/docs when touching those files.
