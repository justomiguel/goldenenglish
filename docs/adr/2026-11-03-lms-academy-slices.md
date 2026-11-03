# Academy LMS slices

## Context

The student can continue a course and print a certificate from live lesson rows. The lesson template, the task status, the section notice, and the saved completion are still missing.

## Decision

Ship five additive slices. Read one unlocked template on the server. Add task answers and teacher returns. Show lesson, task, and attendance percents as separate lines. Store section notices and course completions.

Teacher writes use `auditLearningTaskStaffAction`. That helper records `system_config_audit` for a staff actor. `recordSystemAudit` stays admin-only.

## Options considered

- Average the three percents into one score. Rejected. No approved weight exists.
- Let the student insert a completion row. Rejected. The lesson action writes it with the admin client after it checks every lesson.

## Consequences

- Migrations `235`, `236`, and `237` add the enum value, the review tables, notices, and completions.
- A locked lesson never receives a signed file URL.
- Badge criterion `course_completed` counts rows with `revoked_at` null.
