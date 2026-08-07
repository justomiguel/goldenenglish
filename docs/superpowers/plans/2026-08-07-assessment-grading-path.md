# Assessment Grading Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make create → student → grade → publish a visible path for teacher and admin via a sticky step strip, unified “Calificar” copy, and auto-advance to the next pending student after publish.

**Architecture:** Pure helpers drive path step + next-pending + roster counts. A presentational `AssessmentGradingPathStrip` mounts on the assessments list, admin evaluations panel, and grading matrix. `AssessmentRosterGradingClient` owns open-student state and advances after publish. No new routes, no DB/RLS changes.

**Tech Stack:** Next.js App Router, React client components, Vitest, existing server actions (`upsertGradeAction` / `publishGradeWithNotification`), i18n JSON dictionaries (en/es/pt).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-07-assessment-grading-path-design.md`
- Audience: teacher portal **and** admin evaluations tab (shared matrix)
- Visual: sticky step strip (not full-page wizard, not vertical timeline)
- After publish: auto-open next pending (no grade or draft only)
- Draft save does **not** advance
- No `/assessments/flow` route; no migrations; learning-route attempt review out of scope
- Copy: unify around “Calificar” / “Grade students”; keep “Publicar y avisar a tutores”
- Tokens only (`var(--color-*)`, `var(--layout-border-radius)`); no hardcoded brand hex
- **Commits:** defer all `git commit` steps to a single batch at the end (user request). Still run tests after each task.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/academics/assessmentGradingPath.ts` | Pure: `resolveAssessmentPathStep`, `nextPendingEnrollmentId`, `countAssessmentRosterStatuses`, types |
| `src/components/molecules/AssessmentGradingPathStrip.tsx` | Presentational strip + optional counts line |
| `src/__tests__/lib/academics/assessmentGradingPath.test.ts` | Helper unit tests |
| `src/__tests__/components/AssessmentGradingPathStrip.test.tsx` | Strip UI tests |
| `src/__tests__/components/AssessmentRosterGradingClient.nextStudent.test.tsx` | Publish → next pending |
| `src/components/organisms/AssessmentRosterGradingClient.tsx` | Mount strip, advance on publish, title student·assessment |
| `src/components/molecules/AssessmentGradingEditor.tsx` | Call `onSaved` then let parent advance (no change to persist) |
| `src/components/molecules/CreateCohortAssessmentForm.tsx` | Use new create submit label from dict |
| `src/components/molecules/CohortAssessmentRowActions.tsx` | Uses panel `openMatrix` (dict change only) |
| `src/components/organisms/AcademicSectionAssessmentsPanel.tsx` | Mount strip at step 1-done / step-2 for list context |
| `src/app/[locale]/dashboard/teacher/sections/[sectionId]/assessments/page.tsx` | Mount strip (create-focused = step 1) |
| `src/lib/academics/teacherAssessmentGradeActionsSupport.ts` | Revalidate parent/student `/progress` |
| `src/dictionaries/{en,es,pt}.json` | Path + renamed CTAs + toast/counts strings |
| `src/__tests__/lib/academics/revalidateTeacherGradePaths.test.ts` (or extend existing) | Progress paths asserted |

---

### Task 1: Pure path helpers

**Files:**
- Create: `src/lib/academics/assessmentGradingPath.ts`
- Test: `src/__tests__/lib/academics/assessmentGradingPath.test.ts`

**Interfaces:**
- Consumes: `AssessmentMatrixRosterRow` gradeStatus shape (`"draft" | "published" | null`)
- Produces:
  - `export type AssessmentPathStep = 1 | 2 | 3 | 4`
  - `resolveAssessmentPathStep(input: { hasAssessment: boolean; studentOpen: boolean; justPublished: boolean }): AssessmentPathStep`
  - `isPendingGradeStatus(status: "draft" | "published" | null | undefined): boolean`
  - `nextPendingEnrollmentId(rows: { enrollmentId: string; gradeStatus: "draft" | "published" | null }[], afterEnrollmentId: string): string | null`
  - `countAssessmentRosterStatuses(rows: { gradeStatus: "draft" | "published" | null }[]): { published: number; draft: number; pending: number }`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  countAssessmentRosterStatuses,
  isPendingGradeStatus,
  nextPendingEnrollmentId,
  resolveAssessmentPathStep,
} from "@/lib/academics/assessmentGradingPath";

describe("resolveAssessmentPathStep", () => {
  it("is create when no assessment yet", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: false, studentOpen: false, justPublished: false })).toBe(1);
  });
  it("is student when assessment exists and shell closed", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: true, studentOpen: false, justPublished: false })).toBe(2);
  });
  it("is grade when student shell open", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: true, studentOpen: true, justPublished: false })).toBe(3);
  });
  it("is publish briefly after publish success while still open", () => {
    expect(resolveAssessmentPathStep({ hasAssessment: true, studentOpen: true, justPublished: true })).toBe(4);
  });
});

describe("nextPendingEnrollmentId", () => {
  const rows = [
    { enrollmentId: "a", gradeStatus: "published" as const },
    { enrollmentId: "b", gradeStatus: null },
    { enrollmentId: "c", gradeStatus: "draft" as const },
    { enrollmentId: "d", gradeStatus: "published" as const },
  ];
  it("skips published and returns next null/draft after current", () => {
    expect(nextPendingEnrollmentId(rows, "a")).toBe("b");
    expect(nextPendingEnrollmentId(rows, "b")).toBe("c");
    expect(nextPendingEnrollmentId(rows, "c")).toBe(null);
  });
  it("treats draft as pending", () => {
    expect(isPendingGradeStatus("draft")).toBe(true);
    expect(isPendingGradeStatus(null)).toBe(true);
    expect(isPendingGradeStatus("published")).toBe(false);
  });
});

describe("countAssessmentRosterStatuses", () => {
  it("splits published/draft/pending", () => {
    expect(
      countAssessmentRosterStatuses([
        { gradeStatus: "published" },
        { gradeStatus: "draft" },
        { gradeStatus: null },
        { gradeStatus: null },
      ]),
    ).toEqual({ published: 1, draft: 1, pending: 2 });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/__tests__/lib/academics/assessmentGradingPath.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement helpers**

```ts
// src/lib/academics/assessmentGradingPath.ts
export type AssessmentPathStep = 1 | 2 | 3 | 4;

export function resolveAssessmentPathStep(input: {
  hasAssessment: boolean;
  studentOpen: boolean;
  justPublished: boolean;
}): AssessmentPathStep {
  if (!input.hasAssessment) return 1;
  if (input.justPublished && input.studentOpen) return 4;
  if (input.studentOpen) return 3;
  return 2;
}

export function isPendingGradeStatus(status: "draft" | "published" | null | undefined): boolean {
  return status == null || status === "draft";
}

export function nextPendingEnrollmentId(
  rows: { enrollmentId: string; gradeStatus: "draft" | "published" | null }[],
  afterEnrollmentId: string,
): string | null {
  const start = rows.findIndex((r) => r.enrollmentId === afterEnrollmentId);
  if (start < 0) return null;
  for (let i = start + 1; i < rows.length; i++) {
    if (isPendingGradeStatus(rows[i].gradeStatus)) return rows[i].enrollmentId;
  }
  return null;
}

export function countAssessmentRosterStatuses(
  rows: { gradeStatus: "draft" | "published" | null }[],
): { published: number; draft: number; pending: number } {
  let published = 0;
  let draft = 0;
  let pending = 0;
  for (const row of rows) {
    if (row.gradeStatus === "published") published += 1;
    else if (row.gradeStatus === "draft") draft += 1;
    else pending += 1;
  }
  return { published, draft, pending };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/__tests__/lib/academics/assessmentGradingPath.test.ts`
Expected: PASS

- [ ] **Step 5: Commit** — deferred (batch at end)

---

### Task 2: i18n keys (en/es/pt)

**Files:**
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json`
  - Under `dashboard.teacherAssessmentMatrix` add `path` object
  - Update CTA strings listed below
  - Under `dashboard.academicSectionPage.assessmentsPanel` update `openMatrix`
  - Under `dashboard.teacherAssessmentList` update `createSubmit` (and optionally leave unused `openMatrix` aligned)

**Interfaces:**
- Produces dict shape (identical keys in all three locales):

```ts
// dashboard.teacherAssessmentMatrix.path
{
  stepCreate: string;
  stepStudent: string;
  stepGrade: string;
  stepPublish: string;
  countsLine: string; // "{published} published · {draft} draft · {pending} pending"
  publishedNext: string; // "Published · next {name}"
  allPublished: string; // "Done: all published"
  stripAria: string; // "Grading path"
}
```

Also change:
- `teacherAssessmentMatrix.evaluate` → Calificar / Grade / Avaliar
- `teacherAssessmentMatrix.evaluateAria` → Calificar a {student} / Grade {student} / …
- `teacherAssessmentList.createSubmit` → Crear y calificar / Create and grade / …
- `academicSectionPage.assessmentsPanel.openMatrix` → Calificar alumnos / Grade students / …

Spanish reference values:
- path.stepCreate: `"Crear"`
- path.stepStudent: `"Alumno"`
- path.stepGrade: `"Calificar"`
- path.stepPublish: `"Publicar"`
- path.countsLine: `"{published} publicados · {draft} borradores · {pending} pendientes"`
- path.publishedNext: `"Publicado · sigue {name}"`
- path.allPublished: `"Listo: todos publicados"`
- path.stripAria: `"Camino de calificación"`
- evaluate: `"Calificar"`
- evaluateAria: `"Calificar a {student}"`
- createSubmit: `"Crear y calificar"`
- openMatrix (panel): `"Calificar alumnos"`

- [ ] **Step 1: Add/update keys in en.json, es.json, pt.json with identical shapes**

- [ ] **Step 2: Verify key parity**

Run: `node -e "const e=require('./src/dictionaries/en.json'); const s=require('./src/dictionaries/es.json'); const p=require('./src/dictionaries/pt.json'); const keys=o=>JSON.stringify(Object.keys(o.dashboard.teacherAssessmentMatrix.path).sort()); if(keys(e)!==keys(s)||keys(e)!==keys(p)) process.exit(1); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit** — deferred

---

### Task 3: `AssessmentGradingPathStrip` component

**Files:**
- Create: `src/components/molecules/AssessmentGradingPathStrip.tsx`
- Test: `src/__tests__/components/AssessmentGradingPathStrip.test.tsx`

**Interfaces:**
- Consumes: `AssessmentPathStep` from Task 1; path labels from dict
- Produces: React component

```tsx
export type AssessmentGradingPathStripProps = {
  currentStep: AssessmentPathStep;
  labels: {
    stepCreate: string;
    stepStudent: string;
    stepGrade: string;
    stepPublish: string;
    stripAria: string;
    countsLine?: string; // already interpolated, or omit
  };
  countsText?: string | null;
};
```

Visual rules:
- Horizontal flex of 4 steps with `→` separators
- Done (`index < current`): filled primary background / primary-foreground text
- Current (`index === current`): border-2 primary, surface bg
- Future: muted
- Optional `countsText` under the strip
- `role="list"` / `aria-label={labels.stripAria}`
- Use CSS variables only

- [ ] **Step 1: Write failing UI test** — render with `currentStep={2}`, assert step 1 done styling class/attr, step 2 current, counts text shown when provided

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/__tests__/components/AssessmentGradingPathStrip.test.tsx`

- [ ] **Step 3: Implement strip component**

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit** — deferred

---

### Task 4: Wire strip + next-student on matrix

**Files:**
- Modify: `src/components/organisms/AssessmentRosterGradingClient.tsx`
- Modify: `src/components/molecules/AssessmentGradingEditor.tsx` (only if needed so `onSaved` fires before close; prefer handling advance in parent `onSaved`)
- Test: `src/__tests__/components/AssessmentRosterGradingClient.nextStudent.test.tsx`

**Interfaces:**
- Consumes: helpers from Task 1, strip from Task 3, `dict.path` from Task 2
- Produces: client behavior — after publish, next pending opens

Behavior in `AssessmentRosterGradingClient`:
1. Mount `AssessmentGradingPathStrip` above lead text.
2. `currentStep = resolveAssessmentPathStep({ hasAssessment: true, studentOpen: openId != null, justPublished })` where `justPublished` is a short-lived state set true on publish success then cleared when opening next / after timeout (~600ms) or when advancing.
3. `countsText` from `dict.path.countsLine` with replacements from `countAssessmentRosterStatuses(merged)`.
4. Shell title: `${active.studentLabel} · ${assessmentName}` (not assessment-only).
5. In `onSaved(enrollmentId, status)`:
   - update `statusByEnr`
   - if `status === "draft"`: banner `savedDraftOk`; do not advance
   - if `status === "published"`:
     - compute `next = nextPendingEnrollmentId(mergedWithUpdate, enrollmentId)`
     - if next: set banner `publishedNext.replace("{name}", nextLabel)`; set `justPublished` true; `setOpenId(next)`
     - else: set banner `allPublished`; `setOpenId(null)`
6. Row CTA already uses `dict.evaluate` (updated in Task 2).

- [ ] **Step 1: Write failing test** — mock editor/actions; simulate `onSaved(id, "published")`; expect next pending enrollment becomes open (or all-published banner when last)

Use RTL + mock `AssessmentGradingEditor` to expose a test button that calls `onSaved`, or call the parent handler via rendering the real editor with mocked server actions.

Minimal approach: export nothing extra; render `AssessmentRosterGradingClient` with 3 rows (published, null, draft); mock child editor:

```tsx
vi.mock("@/components/molecules/AssessmentGradingEditor", () => ({
  AssessmentGradingEditor: (props: { onSaved: (id: string, s: "draft" | "published") => void; row: { enrollmentId: string } }) => (
    <button type="button" onClick={() => props.onSaved(props.row.enrollmentId, "published")}>
      mock-publish
    </button>
  ),
}));
```

Open first pending via clicking Calificar, click mock-publish, assert next student’s editor mounts / aria.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement wiring in `AssessmentRosterGradingClient`**

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/__tests__/components/AssessmentRosterGradingClient.nextStudent.test.tsx src/__tests__/lib/academics/assessmentGradingPath.test.ts`

- [ ] **Step 5: Commit** — deferred

---

### Task 5: Strip on teacher list + admin evaluations panel

**Files:**
- Modify: `src/app/[locale]/dashboard/teacher/sections/[sectionId]/assessments/page.tsx`
- Modify: `src/components/organisms/AcademicSectionAssessmentsPanel.tsx` (confirm path; mount strip)
- Modify: `src/components/molecules/CreateCohortAssessmentForm.tsx` only if submit label is hardcoded (prefer dict `createSubmit`)

**Interfaces:**
- Consumes: strip + `resolveAssessmentPathStep({ hasAssessment: false, ...})` on list when showing create, or `hasAssessment: true` / step 2 when table has rows and create is secondary
- Spec: on list page, strip shows step **1** current when create form is the focus; when assessments exist, still show strip with step 1 done and step 2 current (user is picking which exam to open)

Practical rule for list/panel (no student open, assessments may exist):
- `currentStep = rows.length === 0 ? 1 : 2` and treat step 1 as done when `rows.length > 0` — strip already encodes done vs current via `currentStep`, so use `currentStep={rows.length === 0 ? 1 : 2}`.

Pass `dict.dashboard.teacherAssessmentMatrix.path` (or a shared path dict) into list page — list page currently uses `teacherAssessmentList`; import path labels from `teacherAssessmentMatrix.path` to avoid duplicating keys.

- [ ] **Step 1: Mount strip on teacher assessments page above the table/form**

- [ ] **Step 2: Mount strip on `AcademicSectionAssessmentsPanel` the same way**

- [ ] **Step 3: Confirm `CreateCohortAssessmentForm` uses `d.createSubmit` (updated string)**

- [ ] **Step 4: Smoke test**

Run: `npx vitest run src/__tests__/components/AssessmentGradingPathStrip.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit** — deferred

---

### Task 6: Revalidate parent/student progress paths

**Files:**
- Modify: `src/lib/academics/teacherAssessmentGradeActionsSupport.ts` (`revalidateTeacherGradePaths`)
- Test: add assertions in existing support test if present, else create `src/__tests__/lib/academics/revalidateTeacherGradePaths.test.ts` mocking `next/cache`

**Interfaces:**
- Produces: same function, two extra `revalidatePath` calls:

```ts
revalidatePath(`/${p.locale}/dashboard/parent/progress`);
revalidatePath(`/${p.locale}/dashboard/student/progress`);
```

- [ ] **Step 1: Write failing test** that spies `revalidatePath` and expects the two progress URLs

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add the two `revalidatePath` lines**

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit** — deferred

---

### Task 7: Final verification + single commit batch

**Files:** all from Tasks 1–6

- [ ] **Step 1: Run focused suite**

```bash
npx vitest run \
  src/__tests__/lib/academics/assessmentGradingPath.test.ts \
  src/__tests__/components/AssessmentGradingPathStrip.test.tsx \
  src/__tests__/components/AssessmentRosterGradingClient.nextStudent.test.tsx \
  src/__tests__/lib/academics/revalidateTeacherGradePaths.test.ts
```

Expected: all PASS

- [ ] **Step 2: Typecheck touched surfaces**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -40
```

Expected: no errors in new/changed assessment path files (fix unrelated WIP separately)

- [ ] **Step 3: Manual checklist**
  - Teacher: create assessment → strip shows path → calificar alumno → publish → next pending opens
  - Admin: evaluations tab → Calificar alumnos → same matrix strip + next
  - Parent progress Feedback: after publish, refresh shows text (revalidate)

- [ ] **Step 4: Single commit batch (only when user asks)**

```bash
git add \
  src/lib/academics/assessmentGradingPath.ts \
  src/lib/academics/teacherAssessmentGradeActionsSupport.ts \
  src/components/molecules/AssessmentGradingPathStrip.tsx \
  src/components/organisms/AssessmentRosterGradingClient.tsx \
  src/components/organisms/AcademicSectionAssessmentsPanel.tsx \
  src/app/[locale]/dashboard/teacher/sections/[sectionId]/assessments/page.tsx \
  src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json \
  src/__tests__/lib/academics/assessmentGradingPath.test.ts \
  src/__tests__/components/AssessmentGradingPathStrip.test.tsx \
  src/__tests__/components/AssessmentRosterGradingClient.nextStudent.test.tsx \
  docs/superpowers/specs/2026-08-07-assessment-grading-path-design.md \
  docs/superpowers/plans/2026-08-07-assessment-grading-path.md

git commit -m "$(cat <<'EOF'
feat(assessments): guided grading path strip for teacher and admin

Show Create → Student → Grade → Publish on the existing matrix, unify
Calificar copy, auto-open the next pending student after publish, and
revalidate parent/student progress so feedback appears promptly.
EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Step strip Create→Student→Grade→Publish | 1, 3, 4, 5 |
| Teacher + admin same path | 5 (panel) + 4 (shared matrix) |
| Auto next pending after publish | 1, 4 |
| Draft does not advance | 4 |
| Copy Calificar / Grade students | 2 |
| Counts line | 1, 3, 4 |
| Revalidate `/progress` | 6 |
| No new route / no DB | all |
| Tests helpers + strip + next | 1, 3, 4, 6 |
