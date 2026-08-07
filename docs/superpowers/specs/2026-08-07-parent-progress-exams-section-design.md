# Parent/student Progress: show the exams teachers actually create — design

Date: 2026-08-07
Status: approved (user: "ahora como docente cargué una evaluación pero no la veo en progreso o eso no
estamos mostrando ahí? deberíamos, todo lo que no tenga data ni debería estar o debería estar disabled
así no se pierden los padres… idea que cuando ingreses, les marque si un feedback")

## Understanding

The teacher's "evaluación" is a **cohort assessment**: `createCohortAssessmentAction` inserts into
`cohort_assessments` (`name`, `assessment_on`, `max_score`), and grading later upserts
`enrollment_assessment_grades` (`score`, `teacher_feedback`, `status` defaulting to `draft`).

Traced where that reaches a family today:

| Surface | Cohort exam visible? |
|---|---|
| Progress → Mini-tests | Never. `loadStudentMiniTests` only reads `learning_assessments`. |
| Progress → Feedback | Only if the grade is published **and** the teacher typed a comment. |
| Progress → Tasks / Badges | No. |
| Home Progress pillar | Only the single latest **published** grade. |
| Calendar | Yes, as a date. |
| Email | Yes, on publish. |

So the report is correct and the hole is bigger than one screen: **an exam that exists but has not
been graded yet is invisible everywhere except the calendar**, which is exactly the case the user hit
(created it as a teacher, no grades yet). And a published grade with a score but no written comment
never appears on Progress at all.

Two smaller findings from the same trace:

- The Mini-tests section only lists `learning_assessments` that have at least one linked `true_false`
  question, and **no application code ever links questions**, so in practice that section is empty for
  most institutes. It now hides itself, which is the desired behaviour but also means Progress can
  currently show almost nothing.
- The Feedback empty-state copy claims "scores without a comment stay in the Mini-tests tab". That was
  never true; it will be true of the new Exams section.

## Assumptions

- Exams belong to the cohort, so every student enrolled in a section of that cohort sees them. That is
  what the calendar already does and what RLS on `cohort_assessments` already permits.
- Draft grades stay invisible: RLS lets guardians read them, so the `status = 'published'` gate lives
  in the loader, like every other family-facing read of this table.
- Score and max score are shown as the home pillar already shows them (`{score} / {max}`).
- "Only sections with data" is already implemented by the section picker; this change adds a section
  that will very often be the only populated one.

## Plan

### Domain

1. `src/lib/parent/buildStudentExamResults.ts` — pure merge of cohort assessments with the student's
   published grades into `StudentExamResult[]`, newest exam first, each carrying a state:
   - `graded` — a published grade exists (score, and whether a comment came with it);
   - `pending` — the exam date has passed and no published grade exists;
   - `upcoming` — the exam date is still ahead.
2. `src/lib/parent/loadStudentExamResults.ts` — Supabase loader: active enrollments → sections →
   cohorts → `cohort_assessments` (bounded, newest first) → published grades for those enrollments,
   then delegates to the pure builder.

### UI (two trees, Tier A)

3. `src/components/desktop/organisms/StudentExamResultsDesktop.tsx` — pointer-first list with the
   exam name, section, date, and a right-aligned score or state chip.
4. `src/components/pwa/organisms/StudentExamResultsPwaList.tsx` — touch-first stacked rows with the
   score as the leading figure.
5. `src/components/parent/StudentExamResultsSurface.tsx` — `SurfaceMountGate` switch.

### Wiring

6. New `exams` section in `buildProgressSections`, listed **first** (it is what families come for),
   with item keys folding the state in, so a newly scheduled exam and a newly published grade both
   read as unread.
7. Both Progress pages load the new dataset and pass it through `ParentProgressEntry`.

### Entry-point signal

8. The home Progress pillar gains an "unread" mark when the latest published grade carries a comment
   this device has not opened yet. It reuses the same seen-store as the picker, comparing against the
   feedback item key, so opening Feedback clears it. The key is built by one shared helper
   (`parentFeedbackGradeItemKey`) used by both the timeline mapper and the home, so the two can never
   drift apart.

### Copy

9. `dashboard.parent.exams.*` (title, lead, empty, state chips, score line, comment hint) and the five
   section labels move into `progressPicker` so the picker reads coherently: the mini-test section is
   renamed to "Mini-tests" now that "Evaluaciones" means the teacher's exams. Fix the Feedback
   empty-state copy to point at the Exams section. en/es/pt.

### Tests

10. Unit: the exam builder (state per date/grade combination, ordering, missing metadata) and the
    loader (published-only gate, cohort resolution, no enrollments).
11. RTL: both exam trees, the home unread mark, and `ParentProgressEntry` offering Exams and defaulting
    to it.

## Risks and mitigations

- **Cohort-wide exposure.** A student sees every exam of their cohort even if it was created for
  another section of it. That matches the calendar and RLS, and the alternative (guessing which
  sections an exam applies to) has no backing column.
- **An exam with no grade could read as a bad sign.** The `pending` chip says the result is not
  published yet, not that the student failed.
- **Cost.** Four bounded queries, all indexed on the columns used, added to a page that already runs
  four loaders in parallel; the new loader joins the same `Promise.all`.

## Out of scope

- Showing draft grades, rubric detail, or per-dimension scores.
- Letting families see exams of cohorts they are not enrolled in.
- Fixing the mini-test question-linking gap (no UI writes `learning_assessment_questions`); it is
  recorded here as a known limitation.

## Definition of done

- A teacher creating an evaluación sees it appear on the family's Progress screen immediately, marked
  as upcoming or pending, and it turns into a score once the grade is published.
- Sections with nothing to show are still absent from the picker.
- The home entry point marks unread teacher comments.
- en/es/pt complete; `tsc`, ESLint, vitest, `next build` and the coverage gate green.
