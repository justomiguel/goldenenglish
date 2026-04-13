# ADR: Teacher transfer `reason_code` + peer cohort section visibility

## Context

Teachers must suggest intra-cohort transfers to sections they do not teach, while keeping metrics-friendly **structured reasons**. RLS previously limited `academic_sections` reads mostly to rows where `teacher_id = auth.uid()`, which blocked destination pickers for peer sections.

## Decision

1. Add nullable `reason_code` on `public.section_transfer_requests` (app-validated enum: `academic_level`, `schedule`, `behavior`, `other`).
2. Widen `academic_sections` **SELECT** so an authenticated **teacher** may read other sections in a cohort if they teach **any** section in that cohort (admin / student / parent rules unchanged).

## Options considered

- **Client-only peer list** — rejected: would require service role or insecure shortcuts; breaks least privilege.
- **RPC returning destinations** — viable later; policy change is smaller and reusable for other teacher UI.

## Consequences

- **Positive**: Destination combobox can list true cohort capacity and schedules under the teacher session.
- **Risk**: Teachers see metadata (name, schedule, capacity) of peer sections in shared cohorts — acceptable for coordination; not enrollment PII.
- **Follow-up**: Admin analytics on `reason_code`; optional partial unique index on pending requests per `(student_id, from_section_id)` if duplicate spam persists at DB level.
