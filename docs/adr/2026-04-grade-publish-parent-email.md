# ADR: Published grade email to guardians (Resend)

## Context

Teachers publish cohort assessment grades stored as structured `rubric_data` (JSONB). Guardians should be notified without opening the app first.

## Decision

Add `publishGradeWithNotification` server action: after a successful upsert with `status = published`, send HTML email via existing `EmailProvider` (Resend) to each `tutor_student_rel` linked to the student, using `createAdminClient().auth.admin.getUserById` to resolve login emails (same pattern as transfer-approved notifications).

## Options considered

- **In-app notification only** — rejected: email matches product expectation for grade visibility.
- **Queue / job worker** — deferred: add when outbound volume requires it; current flow is best-effort after persist.

## Consequences

- **Positive:** Parents receive rubric + score summary aligned with portal data.
- **Risk:** Email failure does not roll back the publish (grade remains authoritative); logs/monitoring should watch Resend errors.
- **Follow-ups:** Optional `user_events` for publish; rate limits if abuse appears.
