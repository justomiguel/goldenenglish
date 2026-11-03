# Academy LMS slices

## Intent

Finish the academy LMS in five slices. Each slice has its own spec. Implement one slice only after that spec is approved.

## Order

1. Lesson materials — `2026-11-03-lms-lesson-materials-design.md`
2. Task review — `2026-11-03-lms-task-review-design.md`
3. Course result — `2026-11-03-lms-course-result-design.md`
4. Section notice — `2026-11-03-lms-section-notice-design.md`
5. Saved certificate — `2026-11-03-lms-course-certificate-record-design.md`

The continue card is already specified in `2026-11-02-student-lms-continue-design.md`. These five slices start after that card.

## Shared rules

- The audience is an academy: dance, languages, sports, and similar schools.
- Do not add forums, SCORM, or a university campus.
- Institute copy stays in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
- A new table or a new RLS policy needs an ADR in the same implementation.
- Web and PWA stay separate trees on Tier A screens.
- Each slice ships with Vitest coverage for its pure rule.

## Done when

- The five spec files exist.
- No product code changes in this step.
