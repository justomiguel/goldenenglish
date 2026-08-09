# Progress goes silent when a family read times out — design

Date: 2026-08-07
Status: draft, awaiting approval
Reported by: user, signed in as the tutor of a real student ("entré con la mamá de Luna y cuando voy a
progreso solo me muestra los badges")

## Understanding

The report is reproducible and the cause is measured, not guessed. Signing in as the real tutor
(`tutor_student_rel` → student Luna Vera, section ADVANCED) and running exactly the queries the
Progress loaders run, with that parent's own session and therefore under RLS:

| # | Query the page makes | Result as the tutor |
|---|---|---|
| 1 | `section_enrollments` of the ward | 1 row |
| 2 | `academic_sections` of those enrolments | 1 row |
| 3 | `cohort_assessments` of those cohorts — **the Exams section** | **`canceling statement due to statement timeout`** |
| 4 | `enrollment_assessment_grades` published, by enrolment | 1 row |
| 5 | the same grades embedding `cohort_assessments(...)` — **the Feedback section** | **`canceling statement due to statement timeout`** |
| 6 | `tutor_student_rel` | 1 row |

The same queries under the service role return instantly. The data is correct and complete: one
published grade, score 5/10, comment "Excelente participación.", on the assessment "Speaking - reel",
for an active enrolment whose section belongs to the assessment's cohort.

So the family is not missing data. **Two family-facing reads time out under RLS, and the UI renders a
timeout exactly like "there is nothing here".** Badges survives only because
`loadStudentBadgeDisplayRows` uses `createAdminClient()` and never passes through RLS at all.

### Why the policy times out

`cohort_assessments_select_scope` resolves the family branch inline:

```sql
OR EXISTS (
  SELECT 1 FROM public.section_enrollments e
  JOIN public.academic_sections s ON s.id = e.section_id
  WHERE s.cohort_id = cohort_assessments.cohort_id
    AND ( e.student_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts
                     WHERE ts.tutor_id = auth.uid() AND ts.student_id = e.student_id) )
)
```

Both joined tables are themselves RLS-protected, and their policies reference each other — the
`academic_sections` ↔ `section_enrollments` cycle this repo already documents. The teacher branch was
given a `SECURITY DEFINER` helper (`cohort_assessment_teacher_can_see`) precisely to escape that cycle;
the family branch never was. On a database with **one** assessment row and 117 enrolments the planner
still cannot finish inside the `authenticated` statement timeout, which is the signature of policy
recursion rather than of data volume.

A second, smaller aggravator: `auth.uid()` is called bare instead of as `(SELECT auth.uid())`, so it is
re-evaluated per row instead of once as an initplan.

### Why the screen said nothing

This is the part worth fixing beyond the policy. Every Progress loader swallows read failures:
`loadStudentFeedbackTimeline` and `loadStudentExamResults` log through `logSupabaseClientError` and then
fall back to `?? []`; `loadStudentMiniTests` and `loadStudentLearningTasks` never inspect `.error` at all,
which also puts them outside rule 25. `buildProgressSections` then drops every section whose `count` is
0. A failed read and an empty ward are therefore the same pixels, and the section disappears from the
picker entirely — the family cannot even tell there was something to look at.

That is how a backend problem became "mi hijo no tiene nada cargado".

## Assumptions

- The timeout is environmental in severity but not in nature: the golden Supabase project is answering
  slowly right now (2–8 s per REST call, one Cloudflare 521 observed), which makes an already pathological
  plan cross the limit. Fixing the plan is the durable fix; the slow project only changed when it started
  hurting.
- Families must keep seeing every assessment of their cohort, as today. This changes how the rule is
  evaluated, never who passes it.
- Badges keeps its admin client. Rewriting that is a separate concern.

## Plan

### 1. Make the family branch cheap (migration)

New `SECURITY DEFINER` helper, mirroring the teacher one:

```sql
CREATE OR REPLACE FUNCTION public.user_is_family_of_cohort(p_user uuid, p_cohort uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.section_enrollments e
      JOIN public.academic_sections s ON s.id = e.section_id
     WHERE s.cohort_id = p_cohort
       AND ( e.student_id = p_user
             OR EXISTS (SELECT 1 FROM public.tutor_student_rel ts
                         WHERE ts.tutor_id = p_user AND ts.student_id = e.student_id) )
  );
$$;
```

`cohort_assessments_select_scope` then reads
`OR public.user_is_family_of_cohort((SELECT auth.uid()), cohort_id)`, and every `auth.uid()` in that
policy becomes `(SELECT auth.uid())`. Same predicate, same rows, no cycle.

Migration number: the next free one at implementation time. `176` is taken by the registrations work in
flight, and the student-care spec claims `177`, so this will likely be `178` — confirmed against the
directory before writing, not assumed.

Re-measure afterwards with the same tutor session. If query 5 still times out, the twin family branch in
`enrollment_assessment_grades_select_scope` gets the same treatment in the same migration.

### 2. Stop swallowing the failure

Each of the five Progress loaders accepts an optional `onLoadError?: (scope: string) => void`. Optional,
so no existing caller changes. `loadStudentMiniTests` and `loadStudentLearningTasks` start inspecting
`.error` and logging it, which is rule 25 compliance they owe anyway.

### 3. Say so instead of hiding

- Both Progress pages collect the section ids whose load failed and pass them down.
- `buildProgressSections` keeps a failed section in the list even at count 0, marked `failed: true`, so it
  never silently vanishes.
- The picker marks such a section, and its panel renders a retry state — "no pudimos cargar esto" with a
  refresh affordance — instead of the empty state that currently lies.
- A single banner above the picker when anything failed, so the family understands the screen is
  incomplete rather than their child being idle.
- Copy in en/es/pt.

## Tests

- Migration test in the house style (`src/__tests__/supabase/*Migration.test.ts`): the helper exists, is
  `SECURITY DEFINER` with a pinned `search_path`, the policy calls it, and the inline join is gone from the
  family branch.
- Unit: `buildProgressSections` keeps failed sections and flags them; loaders invoke `onLoadError` with a
  stable scope when Supabase returns an error, and do not invoke it on success.
- RTL: a failed section renders the retry state and not the empty state; the banner appears only when
  something failed; nothing changes visually when every load succeeds.

## Risks and mitigations

- **A `SECURITY DEFINER` helper bypasses RLS by design.** It takes the caller's id as an argument and only
  ever answers a boolean about that id, which is the same shape the teacher helper already has and the same
  audit surface.
- **Migration number collision with two sessions working in parallel.** Checked against the directory
  immediately before writing the file.
- **A retry state could become noise if the project stays slow.** It is strictly better than the silence it
  replaces, and it names the real problem instead of blaming the data.

## Out of scope

- Making Badges go through RLS like the rest.
- Auditing every other RLS policy for the same inline-join pattern; this fixes the one that is provably
  timing out and leaves a helper others can adopt.
- The slowness of the golden Supabase project itself, which is infrastructure.
- Retrying failed reads automatically on the server.

## Definition of done

- Signed in as Luna's mother, Progress offers Exams and Feedback, and the comment "Excelente
  participación." is readable.
- A read that fails shows a retry state, never an absent section.
- `tsc`, ESLint, vitest, `next build` and the coverage gate green.
