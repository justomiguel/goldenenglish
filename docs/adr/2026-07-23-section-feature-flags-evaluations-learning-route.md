# ADR: Section feature flags for evaluations and learning route

**Date:** 2026-07-23  
**Status:** Accepted  
**Spec:** `docs/superpowers/specs/2026-07-23-section-feature-flags-evaluations-learning-route-design.md`

## Context

Admin section detail always exposed **Assessments** and **Learning route** tabs. Not every section needs either surface; enabling them for all sections created noise and implied pass/progress rules that did not apply.

## Decision

Add two booleans on `academic_sections`:

- `requires_evaluations_to_pass` (default `false`)
- `uses_learning_route` (default `false`)

Configured in the section **Configuration** tab. Tabs and learner/teacher progress surfaces follow the flags. Disabling is blocked while section assessments exist or a `section_learning_routes` row has `mode = 'route'`.

## Alternatives considered

- Infer visibility from existing assessments / route rows — rejected (no empty-tab setup path; no explicit opt-in).
- JSONB settings blob — rejected (two typed columns are clearer and queryable).

## Consequences

- Migration `171_section_feature_flags_evaluations_learning_route.sql`.
- Existing sections hide those tabs until an admin enables the flags.
- Assessment create and route assign fail closed when the matching flag is off.
- Admin tours treat those tab anchors as optional / conditional.
