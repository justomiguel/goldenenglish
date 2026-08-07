# Section feature flags (evaluations & learning route) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-section booleans control Evaluations / Learning route tabs and pass/progress surfaces, default off, with disable guards when data exists.

**Architecture:** Additive columns on `academic_sections`; pure tab-visibility helper; server action with existence guards; shell filters tabs; assessment/route mutations fail-closed when flags off.

**Tech Stack:** Next.js App Router, Supabase migrations, Zod server actions, Vitest, dictionaries en/es(/pt).

**Spec:** `docs/superpowers/specs/2026-07-23-section-feature-flags-evaluations-learning-route-design.md`

## Global Constraints

- Defaults `false` for new and existing sections.
- Disable blocked if assessments exist / `section_learning_routes.mode = 'route'`.
- Copy via dictionaries; no hardcoded UI strings.
- Files ≤250 lines; one main export per component file.
- TDD vertical slices; self-contained tests (`30`).
- ADR for data + progress contract (`10`).

---

## File map

| Path | Role |
|------|------|
| `supabase/migrations/171_section_feature_flags_evaluations_learning_route.sql` | Columns |
| `docs/adr/2026-07-23-section-feature-flags-evaluations-learning-route.md` | Decision |
| `src/lib/academics/visibleAcademicSectionShellTabs.ts` | Pure tab filter + tab param resolve |
| `src/lib/academics/sectionFeatureFlagGuards.ts` | Pure “can disable?” from counts/mode |
| `src/app/.../sectionFeatureFlagActions.ts` | Persist flags + DB guards |
| `src/components/organisms/AcademicSectionFeatureFlagsEditor.tsx` | Config toggles |
| `AcademicSectionShellTabs.tsx` / `PageShellBody.tsx` | Conditional tabs |
| `loadAdminSectionPageData.ts` | Load flags |
| Assessment / learning-route actions | Fail-closed when flag off |
| Dictionaries + tour contracts | Copy + optional anchors |

## Tasks

### Task 1: Pure helpers (TDD)

- [x] Test `visibleAcademicSectionShellTabs` / `resolveAcademicSectionShellTab`
- [x] Test `canDisableRequiresEvaluations` / `canDisableUsesLearningRoute`
- [x] Implement helpers

### Task 2: Migration + ADR

- [x] Add migration `171_*`
- [x] ADR documenting defaults and guards
- [x] Touch `masterdb.sql` columns if workflow expects

### Task 3: Load + action

- [x] Extend `AdminSectionPageData.section` with both booleans
- [x] Action `updateAcademicSectionFeatureFlagsAction` (or per-flag) with guards + audit + revalidate
- [x] Action tests (mocked Supabase)

### Task 4: Admin UI

- [x] `AcademicSectionFeatureFlagsEditor` in Configuration
- [x] Shell accepts `enabledTabs` / filters order
- [x] Deep-link fallback when tab disabled
- [x] i18n keys en/es (+ pt if present for namespace)
- [x] Component tests

### Task 5: Mutation + surface gates

- [x] Gate assessment create / route assign when flags false
- [x] Health overview: skip assessment/route requirement flags when off
- [x] Teacher/student loaders or UI entry points skip when flags false (minimal complete path)

### Task 6: Tours + verification

- [x] Update L1/L2 so evaluations/learningRoute anchors are optional when not mounted
- [x] Run targeted Vitest
- [x] Manual QA checklist for user

---
