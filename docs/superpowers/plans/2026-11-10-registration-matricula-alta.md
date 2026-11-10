# Plan — matrícula before alta

Spec: `docs/superpowers/specs/2026-11-10-registration-matricula-mark-design.md`

1. Alta writes `status = new` and `intake_state = needs_section`. It does not enrol a section.
2. A fee above zero blocks the manual alta until `fee_captured` is true.
3. Mercado Pago, receipt approval, and the in-person mark run that alta and store the pay method on the registration.
4. The open list keeps the row. Staff assign a section from the cohort of `preferred_section_id`.
5. A section from another cohort returns `section_cohort_mismatch`. A saved enrollment sets `status = enrolled`, and the open list drops the row.
6. Web and the narrow card show the same mail button, in-person mark, pay line, and section select.
