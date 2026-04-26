# Section Content Planning and Assessments

## Context

The first learning task model covered reusable multimedia templates, section task instances, student engagement, and completion state. The product now needs a broader academic content model: admins and teachers should prepare the content plan for a section, keep a reusable global library, relate planned content to live classes, and evaluate readiness through entry, exit, and formative assessments.

## Decision

Move the primary content entry point to **Admin > Academic > Contents** and model section-level planning explicitly:

- `section_content_plans` owns teacher objectives, general scope, and evaluation criteria for a section.
- `planned_lessons` represents ordered but non-linear planned content units.
- `live_lessons` records what was actually taught.
- `live_lesson_planned_lesson_links` supports merged, split, skipped, extra, and remediation classes.
- `question_bank_items` is the reusable question bank.
- `learning_assessments` and `learning_assessment_questions` support entry, exit, formative, mini-test, and diagnostic assessments.
- `student_assessment_attempts` stores per-student evidence with question snapshots.
- `student_learning_readiness` stores the teacher's explicit readiness decision.

`content_templates` remains a reusable global library. Copying from it into a section plan is explicitly detached: later template edits do not mutate section plans.

## Options Considered

- Keep “Master Classes” as the primary teacher workspace: rejected because the operational unit is the section/nivel, not the global template.
- Make mini-tests mandatory for completion: rejected because teachers need judgement and can advance a student after a failed check.
- Store only numeric grades: rejected because diagnostics, pass/fail, rubrics, oral checks, and manual feedback are first-class assessment modes.

## Consequences

- Admin and section teachers/assistants both need write access to content plans.
- Tutor visibility remains read-only and optional; students must see feedback even without a tutor.
- Attempts must snapshot question content so later bank edits do not alter historical evidence.
- The UI should distinguish planned content from live classes actually delivered.
