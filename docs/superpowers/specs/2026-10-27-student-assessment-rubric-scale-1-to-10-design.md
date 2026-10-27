# Student Assessment Rubric Scale 1 to 10

## Intent

Change the default rubric criterion scale on student cohort assessments from `1–5` to `1–10`. Keep existing `1–5` grades valid and preserve the quick-tap number buttons in the teacher grading form.

## Context

Cohort rubric exams (`cohort_assessments` and `enrollment_assessment_grades`) grade five default criteria:

- `speaking`
- `grammar`
- `vocabulary`
- `listening`
- `fluency`

Today, `defaultRubricDimensionsFromI18n`, `parseCohortRubricDimensionsJson`, `defaultAssessmentRubric`, and `rubricSuggestedScore` default to a `1–5` scale. In `GradingForm`, criteria with `span(d) <= 5` render tap buttons, while larger spans fall back to a range slider.

## Design

### 1. Rubric dimension defaults (`src/lib/academics/`)

- Update `defaultRubricDimensionsFromI18n` and the fallback in `parseCohortRubricDimensionsJson` (`src/lib/academics/cohortRubricDimensions.ts`) from `scaleMax: 5` to `scaleMax: 10`.
- Round the default midpoint in `normalizeRubricValuesForDimensions` (`Math.round((d.scaleMin + d.scaleMax) / 2)`) so integer scales (`1–10`) initialize to an integer value (`6`) instead of `5.5`.
- Update `defaultAssessmentRubric` and `normalizeRubricFromDb` (`src/lib/academics/assessmentRubricDefaults.ts`) to use the `1–10` range (`default: 6`, valid `1..10`).
- Update `rubricSuggestedScore.ts` (`averageRubric1to5` / `suggestedScoreFromRubric`) to accept `1..10` and divide by `10`.
- Update `AssessmentGradingEditor.tsx` fallback midpoint to `Math.round((d.scaleMin + d.scaleMax) / 2)`.

### 2. Grading form controls (`src/components/molecules/GradingForm.tsx`)

- Raise the button-group threshold from `span(d) <= 5` to `span(d) <= 10`.
- Teachers continue to tap discrete number buttons (`1` through `10`) with `min-h-[44px] min-w-[44px]` touch targets instead of a range slider.

### 3. Existing data compatibility

- `enrollment_assessment_grades.rubric_data` stores numeric values in JSONB without a database check constraint on `5`. No database migration is needed.
- Existing grades with values `1..5` remain valid inside `1..10`.
- Hydrated grades keep `scoreLocked = true` in `AssessmentGradingEditor`, so saved final scores do not change unless the teacher edits or syncs the rubric.

## Surfaces (Web vs PWA)

- **Teacher / Admin grading (`AssessmentRosterGradingClient` + `AssessmentGradingShell` + `GradingForm`):**
  - Uses `useAppSurface()` (`narrow` for `web-mobile` and `pwa-mobile`, modal/panel for `web-desktop`).
  - **Web (`web-desktop`):** Renders the `1–10` button group in a wrapping flex row inside the grading dialog.
  - **PWA / Mobile (`web-mobile` / `pwa-mobile`):** Renders the same `1–10` buttons with `min-h-[44px] min-w-[44px]` touch targets inside the mobile sheet, wrapping cleanly across two rows.
- **Student portal (`StudentDashboardEntry` + `StudentPublishedGradesSection` + `StudentGradeRadar`):**
  - Tier A surface behind `SurfaceMountGate` (`desktop` and `narrow` `PwaPageShell`).
  - `loadStudentPublishedGrades` sets `fullMark: d.scaleMax` (`10`) on each radar point; `StudentGradeRadar` normalizes `value / fullMark * 100` on both surfaces.
- **Parent portal (`StudentExamResultsSurface`):**
  - Displays overall `score / maxScore` (`cohort_assessments.max_score` already defaults to `10`). Shared props and hooks remain unchanged.

## Done When

- Default rubric dimensions use `scaleMin: 1` and `scaleMax: 10`.
- `GradingForm` renders `1..10` buttons (`min-h-[44px] min-w-[44px]`) for each criterion.
- Unit and component tests under `src/__tests__/` pass in isolation.
- Product changelog entry is added to `src/lib/product-changelog/catalog.ts` before commit.

## Out of Scope

- Survey questionnaires (`admin.questionnaires` question type `scale`, which is a separate survey tool).
- Rescaling historical `enrollment_assessment_grades` rows in the database.
