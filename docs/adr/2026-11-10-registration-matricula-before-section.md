# ADR — Matrícula before a section

## Context

Accepting a pre-inscription enrolled the requested section and set `registrations.status` to `enrolled`. The open Inscripciones list hides enrolled rows. A fee could stay unpaid, and staff lost the person. A 2027 registration was also offered sections from the open inscriptions cohort.

## Decision

Create the student only after the matrícula is confirmed when that fee is above zero. Do not enrol a section at that step. Keep the row on the open list with `intake_state = needs_section`. Staff later assign a section from the cohort of `preferred_section_id`. That save sets `status = enrolled`, and the open list drops the row.

Store the pay method on `registrations` (`cash`, `gateway`, or `transfer`) so the row can say Mercado Pago, in person, or receipt before a section exists.

## Options considered

Enrol the requested section at payment time. Rejected. The person must stay in Inscripciones until staff choose the section, and that section must belong to the cohort they registered for.

## Consequences

- Accept no longer writes section enrollments or join-month rows. Join billing runs when the section is assigned, with disposition `behind`.
- A section from another cohort returns `section_cohort_mismatch`.
- Tests cover the unpaid block, the pay lines, the cohort check, and the enrolled write that leaves the open list.
- The pay method is an operational field. The server log uses the same failure code the person sees. No new product event type.
