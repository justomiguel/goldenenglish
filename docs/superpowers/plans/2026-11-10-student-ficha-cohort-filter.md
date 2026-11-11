# Student ficha cohort filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff pick a cohort on the student ficha and see that cohort's sections and payments.

**Architecture:** One pure filter builds the cohort list and scopes rows. The ficha stores the choice in `?cohort=` through `usePersistentPageTab`. Académico keeps the vigente editor and shows a read-only list for every other cohort. Pagos filters the existing billing client.

**Tech Stack:** Next.js App Router, Vitest, Testing Library, Supabase server loader, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Académico on the vigente cohort still adds and removes sections.
- Another cohort is read-only: section, status, current teacher, current assistants.
- Pagos limits the section select and the payment rows to the selected cohort.
- A payment with a null `section_id` stays out of every cohort view.
- Unknown `cohort` query falls back to the vigente cohort, or to the newest enrollment cohort.
- The query key is `cohort`. The page tab stays `tab`.
- Web and `AdminUserDetailPwa` share the panels. The combo is full width and at least 44px tall.
- Copy lives in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
- A failed enrollment read logs `[ge:server]` with scope `loadAdminStudentCohortOptions` and code `cohort_list_failed`.
- No new table, RLS, analytics event, or ADR.

---

### Task 1: Pure cohort filter

**Files:** `src/lib/dashboard/studentFichaCohort.ts`, `src/__tests__/lib/dashboard/studentFichaCohort.test.ts`

- [ ] Write a failing test for the option list, the default cohort, an unknown id, payment filtering, and one benefit per section.
- [ ] Run the test and confirm it fails.
- [ ] Implement the pure functions.
- [ ] Run the test and confirm it passes.

### Task 2: Enrollment loader

**Files:** `src/lib/dashboard/loadAdminStudentCohortEnrollments.ts`, `src/__tests__/lib/dashboard/loadAdminStudentCohortEnrollments.test.ts`, `src/lib/dashboard/loadAdminUserDetail.ts`, `src/lib/dashboard/adminUserDetailVM.ts`

- [ ] Write a failing loader test for a past enrollment and for `cohort_list_failed`.
- [ ] Load every enrollment status, with teacher and assistants, in pages of at most 1000.
- [ ] Attach the rows and the code on the student detail VM.

### Task 3: Billing cohort id

**Files:** `src/types/adminStudentBilling.ts`, `src/lib/dashboard/loadAdminStudentBillingTabData.ts`, `src/lib/dashboard/loadAdminStudentBillingTabDataMappers.ts`

- [ ] Add `cohortId` and `enrollmentStatus` on each section benefit.
- [ ] Load enrollments of every status.
- [ ] Extend the mapper test so a nested cohort id is read.

### Task 4: Académico combo

**Files:** `src/components/molecules/AdminStudentCohortSelect.tsx`, `src/components/molecules/AdminStudentCohortHistoryList.tsx`, `src/components/molecules/AdminUserAcademicPanel.tsx`, dictionaries

- [ ] Write a failing test: another cohort shows the section and the teacher, and hides add/remove.
- [ ] Render the combo. Vigente cohort keeps `AdminStudentCurrentCohortAssignmentCard`.
- [ ] Show `cohort_list_failed` with the sentence and the code.

### Task 5: Pagos combo

**Files:** `src/components/dashboard/AdminStudentBillingClient.tsx`, `src/components/molecules/AdminUserProfileFicha.tsx`, `src/hooks/useAdminStudentCohortSelection.ts`

- [ ] Write a failing test: the section select lists only the selected cohort.
- [ ] Persist `cohort` and pass it into Académico and Pagos.
- [ ] Enable Pagos when the student has any enrollment, including a past cohort.

### Task 6: Verify

- [ ] Run the new unit files.
- [ ] Check the academic and payments panels render the combo.
