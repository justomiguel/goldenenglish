# LMS course and route domain

## Context

Staff need a catalog that tracks courses. The current route is a graph of repository pieces. Moodle and Canvas track progress on the course. A route is an ordered set of courses.

## Decision

Add a category tree, free hashtags, and institute-defined course fields. Add `learning_programs` as sets of courses. Keep the existing `learning_routes` graph until a later cutover.

## Options considered

- Replace `learning_routes` in place. Rejected. That drops the graph staff already saved.
- Store category, tags, and fields as one JSON blob. Rejected. Filters and reports need real columns.

## Consequences

- New migration `234_lms_catalog_hierarchy.sql`. Additive only.
- Student visibility grows when a section is assigned a program.
- Mastery paths and competencies stay out until a later spec.
- Tests cover hashtag normalization, field values, set completion, and the SQL shape.
