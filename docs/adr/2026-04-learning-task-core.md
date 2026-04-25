# Learning Task Core

## Context

Teachers need a central library for rich multimedia lesson templates that can be copied into live section work. Students need a clear task flow, and tutors need read-only visibility into progress. The feature touches persisted HTML, private files, student engagement points, RLS, and multi-role dashboards.

## Decision

Create a learning task bounded context with:

- Global `content_templates` and template assets.
- Section-scoped `task_instances` and copied instance assets.
- Per-student `student_task_progress` rows tied to `section_enrollments`.
- A private `learning-task-assets` storage bucket.
- Server actions as the only mutation boundary for staff and students.

Engagement proof is recorded only after the student has kept the task detail visible and active for at least 5 seconds. The server marks the task `OPENED` and records a `material:task:<id>` event so the existing `user_events` trigger can award engagement points.

## Options Considered

- Reuse `cohort_assessments`: rejected because assessments model grades, not rich lesson bodies, independent assets, or student open/completion state.
- Store task state only in analytics events: rejected because tutors and teachers need exact current status and late completion semantics; analytics remains supporting telemetry.
- Public storage bucket: rejected because lesson PDFs and attachments are student/staff content, not public marketing media.

## Consequences

- RLS must cover admin, teacher/assistant, student, and tutor read paths.
- HTML must be sanitized at the persistence boundary before it reaches `content_templates` or `task_instances`.
- Dashboards should read from relational task state, not from analytics metadata.
- Tests must cover cloning, UTC late calculation, invalid state jumps, upload validation, and the engagement timer.
