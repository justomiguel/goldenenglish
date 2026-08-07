# Teacher + admin assessment grading path

- **Date:** 2026-08-07
- **Status:** approved (brainstorm: path strip on existing UI, auto-next after publish)
- **Scope:** Cohort rubric assessments — teacher portal + admin academic section evaluations tab (shared matrix). Learning-route attempt review is out of scope.

---

## 1. Understanding

Today the create → grade → publish path exists but is hard to follow:

- Entry CTAs say “Evaluar”; the list says “Abrir rúbrica”; the matrix title says “Calificar lista”; the row says “Evaluar” again.
- After create, the app dumps the user into an empty roster with no visible “what’s next”.
- Grading is one student at a time in a modal/sheet with no advance to the next pending student.
- Parents only see feedback for **published** grades with non-empty `teacher_feedback`; an unclear teacher path means empty parent Feedback tabs even when the write path works.

Goal: make the full cycle feel like one continuous path — **Create → Student → Grade → Publish** — for both teacher and admin, without a new route or grading engine.

---

## 2. Decisions (locked)

| Topic | Choice |
|-------|--------|
| Audience | Teacher **and** admin (same visual path) |
| Scope of path | Full cycle: create → pick student → grade → publish → repeat / finish |
| Visual pattern | Sticky **step strip** above existing list/matrix (not full-page wizard, not vertical timeline) |
| After publish | Auto-open the **next pending** student (toast: “Published · next {name}”) |
| Implementation style | Path strip + copy unification + next-student on existing components (no dedicated `/flow` page) |

---

## 3. Path model

Fixed four steps, shown on:

1. Teacher assessments list (`/{locale}/dashboard/teacher/sections/{sectionId}/assessments`)
2. Shared grading matrix (`/{locale}/dashboard/teacher/sections/{sectionId}/assessments/{assessmentId}`) — admin reaches this via evaluations tab + `returnTo`
3. Admin evaluations panel (`AcademicSectionAssessmentsPanel` on `?tab=evaluations`)

| Step | Label (concept) | Active when |
|------|-----------------|-------------|
| 1 | Create | Create form focused / just created; **done** if opening an existing assessment |
| 2 | Student | Matrix roster visible; no student shell open |
| 3 | Grade | Rubric modal/sheet open for a student |
| 4 | Publish | Same editor; emphasis on publish action / brief success before advancing |

Visual states: done = filled; current = strong border; future = muted.

Opening an existing assessment starts at step 2 with step 1 marked done.

---

## 4. UI / components

### New

- `AssessmentGradingPathStrip` — presentational strip: steps, current index, optional counts line.
- Pure helpers (testable, no React/Supabase):
  - `resolveAssessmentPathStep({ hasAssessment, studentOpen, justPublished })`
  - `nextPendingEnrollmentId(rows, afterEnrollmentId)` — pending = no grade **or** `draft` only
  - `countAssessmentRosterStatuses(rows)` → `{ published, draft, pending }`

### Existing (touched, not replaced)

- `CreateCohortAssessmentForm` — submit label → create-and-grade; still redirects to matrix.
- `CohortAssessmentRowActions` / assessments panel — “Abrir rúbrica” → “Calificar alumnos”.
- `AssessmentRosterGradingClient` — mounts strip + counts; on successful publish, set `openId` to next pending (or close shell + “all published” message).
- `AssessmentGradingEditor` / shell — title `Student · Assessment`; draft save does **not** advance; publish success triggers next-student callback.
- Admin create remains out of this path (admin opens/edits/deletes as today); strip still appears when grading.

### Progress line

Under the strip on the matrix: `{n} published · {n} draft · {n} pending`, derived from the roster already loaded (no extra query).

---

## 5. Copy (i18n)

Unify around **“Calificar”** in `en` / `es` / `pt` with identical key shapes:

| Key area | Intent |
|----------|--------|
| `assessmentsPanel.openMatrix` | “Calificar alumnos” / “Grade students” / PT equivalent |
| Matrix row CTA | “Calificar” + aria “Calificar a {student}” |
| Create submit | “Crear y calificar” |
| Path strip labels | Create / Student / Grade / Publish (localized) |
| After publish toast | “Published · next {name}” |
| All done | “Done: all published” |
| Counts line | “{published} published · {draft} draft · {pending} pending” |

Keep publish primary CTA: **“Publicar y avisar a tutores”** (existing).

Remove or stop using orphan keys that conflict (`teacherAssessmentList.openMatrix` unused; prefer one namespace for path + matrix).

---

## 6. Behavior details

### Next student

- Order = current roster order (surname-first as today).
- Pending = `gradeStatus == null` OR `gradeStatus === "draft"`.
- On publish `ok`: toast → open next pending; if none, close shell, show all-done message, strip back to step 2.
- On publish error: stay on current student; do not advance.
- Draft save: stay on current student; update local status amber; strip stays on step 3.

### Cache / parent visibility

Extend `revalidateTeacherGradePaths` to also revalidate:

- `/{locale}/dashboard/parent/progress`
- `/{locale}/dashboard/student/progress`

so published feedback appears on the Feedback tab without a full redeploy/hard refresh.

### Out of scope

- New `/assessments/flow` route
- Batch publish
- DB / RLS / migration changes
- Learning-route attempt review wizard
- Admin creating cohort assessments from the evaluations tab
- End-of-session summary screen (deferred; counts line covers glanceable progress)

---

## 7. Testing

1. **Pure helpers** — path step resolution; next pending skips published; wraps none → null; counts.
2. **Strip UI** — renders done/current/future; shows counts when provided.
3. **Roster client** — after mocked publish success, `openId` becomes next pending; when last, shell closes / all-done shown.
4. **i18n** — new keys present in en/es/pt with matching shapes.
5. **Revalidate paths** — unit or light assertion that progress paths are included.

No E2E required for first ship if component + helper coverage is solid; optional later.

---

## 8. Success criteria

- A teacher or admin can create (or open) an assessment and always see which step they are on.
- “Abrir rúbrica” language is gone from the primary path; CTAs say Calificar / Grade students.
- Publishing one student automatically continues to the next pending student.
- Parent/student progress Feedback tab can refresh to show newly published feedback without waiting on stale cache for `/progress`.
