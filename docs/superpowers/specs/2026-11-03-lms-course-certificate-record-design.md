# Saved course certificate

## Intent

When a student finishes every lesson in a course, the app stores that fact. The certificate page reads the stored row. The badge grid can show it later from the same row.

## Current state

The certificate page checks lesson completion on each request and offers print. Nothing is stored. Badges use `BADGE_CRITERIA_TYPES` and do not know about courses.

## Decision

Add `student_course_completions`.

- One row per student and course. Columns: id, student id, course id, completed at.
- Write the row when a lesson completion makes the course finished. If the row exists, leave `completed_at` as the first time.
- If a later change leaves the course unfinished, keep the row and set `revoked_at`. The certificate page treats a revoked row as not finished.
- The print page requires a row with `revoked_at` null. The page shows the student name, the course title, and `completed_at` formatted with `Intl`.
- Add badge criterion `course_completed`. One active badge in the existing catalog uses that criterion. Eligibility is the count of completion rows with `revoked_at` null.
- The badge translation follows the current badge locales (`en` and `es`). Screen chrome around the certificate stays in `en.json`, `es.json`, and `pt.json`.

## Done when

- Finishing the last lesson inserts one completion row.
- A second lesson write does not change `completed_at`.
- The certificate page renders for that row and refuses a course that is not finished.
- Revoking the row hides the certificate and removes the badge progress.
- The badge appears in the existing student and parent badge grids.
- Copy for the certificate date and the badge title is translated as stated above.

## Out of scope

- A PDF file in storage.
- A public share link for the certificate.
- A signature image or a grade on the certificate.

## Surfaces (Web vs PWA)

Tier A.

- Web: the certificate page stays one column. The print control stays a button. The date is text.
- PWA: the same page sits in a `PwaPageShell`. The print control is at least 44px. Browser print is enough on mobile.
- Badge grids already split by surface. This slice only adds a catalog row. Do not create a new badge component.

## Data and access

- The student reads their own completion rows. A parent reads rows for a linked child. Staff who already manage courses can read them.
- Only the lesson-complete action inserts or revokes a row, on the server, after it recomputes course progress.
- Migration adds the table, the unique pair, `revoked_at`, RLS, and the badge criterion value.
- ADR required for the completion table and the badge criterion.
- Log a failed insert with `[ge:server]` and scope `courses.completion`.

## Tests

- Pure rule: all lessons complete yields one completion. A later incomplete lesson yields revoke. A repeat completion keeps the first timestamp.
- Badge eligibility counts only rows with `revoked_at` null.
