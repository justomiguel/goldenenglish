# ADR: Global staff assistant attendance (no per-section row)

## Context

Staff users with profile role `assistant` need to mark **section attendance** on **any active class**, without an admin adding them to `academic_section_assistants` each time.

## Decision

1. **RLS** — Add `section_enrollment_global_staff_assistant_for_attendance(enrollment_id)` (SECURITY DEFINER) true when `user_has_role(auth.uid(), 'assistant')` and the enrollment’s section is **not archived**. Use it **only** in `section_attendance` policies (SELECT / INSERT / UPDATE / DELETE), not in `section_enrollment_teacher_is_self`, so retention and other tables are unchanged.
2. **Reads** — Extend `academic_sections_select_scope` so `assistant` role can SELECT non-archived sections institute-wide. Extend `section_enrollments_select_scope` similarly for non-archived sections.
3. **App** — `loadTeacherSectionIdsForUser` loads all non-archived sections (cap 500) when `profiles.role === 'assistant'`. `userIsSectionTeacherOrAssistant` returns true for same role on non-archived sections without an assistants row.

## Options considered

- **Only widen `section_enrollment_teacher_is_self`** — Rejected: would also open `enrollment_retention_flags` and other policies referencing that helper.
- **Per-section toggle in settings** — Deferred; institute asked for default “any class”.

## Consequences

- **Positive** — Faster operations for front-desk / staff attendance; no admin bottleneck.
- **Risk** — Any `assistant` account can read enrollments and mark attendance for all active sections; rely on trusted accounts and audit (`recorded_by` on rows).
- **Follow-up** — If multi-tenant institutes share one DB, scope helpers by tenant before adopting this pattern.
