# Workplace Internal Headers Implementation Plan

> **For agentic workers:** Implement in this session. User asked for spec + all leftovers in one wave. Do not commit unless asked.

**Goal:** Every leftover authenticated workplace screen introduces itself with `AdminPageHeader`.

**Architecture:** Replace the page-level `h1` + lead block. Do not restyle lists or forms. Embedded parent screens stay headerless. `ParentWardProfileForm` drops duplicate chrome because `ParentChildDetailLayout` already owns the banner.

**Tech Stack:** Next.js App Router, `AdminPageHeader`, existing Vitest screen tests.

## Global Constraints

- Title colour is `--color-primary` only (already true inside `AdminPageHeader`).
- Do not rename `data-tour` ids.
- Homes stay greetings.
- Do not restyle Impulsa.

---

## Task 1 — Parent standalone + detail + form chrome

- Convert standalone headers in assessments / tasks / badges.
- Convert `ParentTaskDetailScreen`.
- Strip title/back from `ParentWardProfileForm`; update `parentWardProfileForm.test.tsx`.

## Task 2 — Student + teacher internals

- `StudentMiniTestsSection`, `StudentLearningTaskDetail`.
- `TeacherSectionContentsScreen`, `TeacherSectionLearningTasks`.

## Task 3 — PWA-narrow + billing + leftovers

- Attendance, messages PWA, payments PWA.
- `BillingPortalEntry`, `PaymentsFlowReturnSurfaceEntry`, `PortalProfileSurfaceEntry`.
- Non-embedded admin import screens.

## Task 4 — Verify

- Run Vitest on touched tests.
