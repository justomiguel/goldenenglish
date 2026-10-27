# Student Assessment Rubric Scale 1 to 10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the default student cohort assessment rubric criterion scale from `1–5` to `1–10` and keep quick-tap number buttons in `GradingForm`.

**Architecture:** Pure rubric helpers in `src/lib/academics/` define the default `scaleMin: 1` and `scaleMax: 10` dimensions, integer midpoint normalization (`6`), and suggested score calculation. `GradingForm` renders discrete number buttons when `span(d) <= 10`.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Rubric Dimension Defaults and Suggested Score (TDD)

**Files:**
- Modify: `src/__tests__/lib/academics/cohortRubricDimensions.test.ts`
- Modify: `src/__tests__/lib/academics/escapeHtmlAndDefaults.test.ts`
- Modify: `src/lib/academics/cohortRubricDimensions.ts`
- Modify: `src/lib/academics/assessmentRubricDefaults.ts`
- Modify: `src/lib/academics/rubricSuggestedScore.ts`

- [ ] **Step 1: Update unit tests to expect `1–10` default scale and integer midpoint (`6`)**
- [ ] **Step 2: Run Vitest on the two test files and confirm failure (Red)**
- [ ] **Step 3: Update `cohortRubricDimensions.ts`, `assessmentRubricDefaults.ts`, and `rubricSuggestedScore.ts`**
- [ ] **Step 4: Run Vitest on the two test files and confirm pass (Green)**

### Task 2: GradingForm `1–10` Buttons and AssessmentGradingEditor Midpoint (TDD)

**Files:**
- Create: `src/__tests__/components/GradingForm.test.tsx`
- Modify: `src/__tests__/components/AssessmentGradingEditor.publish.test.tsx`
- Modify: `src/components/molecules/GradingForm.tsx`
- Modify: `src/components/molecules/AssessmentGradingEditor.tsx`

- [ ] **Step 1: Write `GradingForm.test.tsx` asserting 10 discrete buttons (`1` to `10`) render for `1–10` dimensions and update suggested score**
- [ ] **Step 2: Run Vitest on `GradingForm.test.tsx` and confirm failure (Red)**
- [ ] **Step 3: Update `GradingForm.tsx` (`span(d) <= 10`) and `AssessmentGradingEditor.tsx` (`Math.round((d.scaleMin + d.scaleMax) / 2)`)**
- [ ] **Step 4: Run Vitest on `GradingForm.test.tsx` and `AssessmentGradingEditor.publish.test.tsx` and confirm pass (Green)**
