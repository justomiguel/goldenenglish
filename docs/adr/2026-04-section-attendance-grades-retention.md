# ADR: Section attendance, grades, and retention alerts

## Context

Legacy `public.attendance` is global per student/day and powers existing portal stats. Academic sections need **per-enrollment** attendance and grades with teacher entry UX and admin retention visibility.

## Decision

1. Add **`section_attendance`** (FK `section_enrollments`, `attended_on`, `status` enum including late/excused, `notes`, `recorded_by`).
2. Add **`section_grades`** (assessment, numeric score 0–10, feedback, `rubric_data` JSONB).
3. Add **`retention_alerts`** plus **`enrollment_retention_flags`** for admin follow-up without widening `section_enrollments` teacher UPDATE privileges.
4. Keep legacy `public.attendance` unchanged.

## Consequences

- **Positive**: Clear RLS per section teacher; retention pipeline can grow (notifications, WhatsApp handoff in app layer).
- **Risk**: Two attendance systems until a future consolidation/migration path is defined.
- **Follow-up**: Optional materialized view or RPC merging legacy + section metrics for unified dashboards.
