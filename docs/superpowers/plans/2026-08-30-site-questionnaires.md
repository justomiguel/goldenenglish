# Site Questionnaires Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins create public or login-only questionnaires from site settings; visitors fill `/q/[slug]`; admins see charts, lists, and CSV.

**Architecture:** Dedicated tables (`questionnaires`, `questionnaire_questions`, `questionnaire_responses`, `questionnaire_answers`). Pure domain helpers in `src/lib/questionnaires/`. Admin under `/dashboard/admin/settings/questionnaires`. Public fill under `/q/[slug]` with `PublicBlogPageShell`. Landing section is shared and mounted from the home page, not a CMS block.

**Tech Stack:** Next.js App Router, Supabase (RLS + service-role submit transaction), Recharts, existing admin list/editor atoms, en/es/pt dictionaries.

## Global Constraints

- Additive migration only (`21-migrations-production-no-data-destruction`).
- Never `GRANT ALL ON ALL TABLES` to anon (`187` warning).
- File ceiling ~250 lines (`03-architecture.mdc`).
- Copy in `en.json` + `es.json` + `pt.json` same shape (`09-i18n-copy.mdc`).
- Do not reuse `event_form_fields` or `question_bank_items`.
- Editor v1 writes i18n JSON for `defaultLocale` (`es`) only.
- Question types v1: `text`, `textarea`, `email`, `phone`, `number`, `date`, `yes_no`, `single_choice`, `multi_choice`, `scale` (always 1–5).
- Admin only; teachers cannot manage or see results.
- No files, branching, response delete, or critical E2E in v1.

---

## File map

**Create**

- `supabase/migrations/204_site_questionnaires.sql`
- `src/lib/questionnaires/types.ts`
- `src/lib/questionnaires/pickI18n.ts`
- `src/lib/questionnaires/normalizeSlug.ts`
- `src/lib/questionnaires/canPublish.ts`
- `src/lib/questionnaires/validateAnswers.ts`
- `src/lib/questionnaires/hasExistingResponse.ts`
- `src/lib/questionnaires/aggregateResults.ts`
- `src/lib/questionnaires/formatAnswerCsv.ts`
- `src/lib/questionnaires/respondentLabel.ts`
- `src/lib/questionnaires/loadAdminQuestionnaires.ts`
- `src/lib/questionnaires/loadPublicQuestionnaire.ts`
- `src/lib/questionnaires/loadLandingQuestionnaires.ts`
- `src/lib/questionnaires/submitQuestionnaireResponse.ts`
- `src/app/[locale]/dashboard/admin/settings/questionnaires/page.tsx`
- `src/app/[locale]/dashboard/admin/settings/questionnaires/[id]/page.tsx`
- `src/app/[locale]/dashboard/admin/settings/questionnaires/[id]/results/page.tsx`
- `src/app/[locale]/dashboard/admin/settings/questionnaires/actions.ts`
- `src/app/[locale]/dashboard/admin/settings/questionnaires/questionActions.ts`
- `src/app/[locale]/dashboard/admin/settings/questionnaires/submitResultsCsvAction.ts`
- `src/app/[locale]/q/[slug]/page.tsx`
- `src/app/[locale]/q/[slug]/actions.ts`
- `src/app/[locale]/q/layout.tsx`
- `src/components/dashboard/admin/questionnaires/QuestionnaireAdminListScreen.tsx`
- `src/components/dashboard/admin/questionnaires/QuestionnaireEditorShell.tsx`
- `src/components/dashboard/admin/questionnaires/QuestionnaireQuestionList.tsx`
- `src/components/dashboard/admin/questionnaires/QuestionnaireQuestionAddPanel.tsx`
- `src/components/dashboard/admin/questionnaires/QuestionnaireResultsScreen.tsx`
- `src/components/dashboard/admin/questionnaires/QuestionnaireResultsCharts.tsx`
- `src/components/dashboard/admin/settings/QuestionnairesSettingsCard.tsx`
- `src/components/organisms/LandingQuestionnairesSection.tsx`
- `src/components/organisms/QuestionnairePublicForm.tsx`
- Tests under `src/__tests__/lib/questionnaires/`, `src/__tests__/db/`, `src/__tests__/components/dashboard/admin/questionnaires/`

**Modify**

- `src/dictionaries/{en,es,pt}.json` — `admin.questionnaires`, `landing.questionnaires`, `adminNav.questionnaires` + tip
- `src/lib/dashboard/buildAdminInstituteHubGroups.ts` — site row
- `src/lib/dashboard/adminSurfaceIcon.tsx` — `questionnaires` icon
- `src/lib/dashboard/adminPageHeaderArt.ts` — family `institute`
- `src/app/[locale]/dashboard/admin/settings/page.tsx` — card
- `src/app/[locale]/page.tsx` — load + render landing section
- Hub/icon tests that pin exact site rows / icon catalogs

---

### Task 1: Domain helpers (TDD)

Pure functions first. No React, no Supabase.

- [x] Tests + impl: `pickI18n`, `normalizeSlug`, `canPublish`, `validateAnswers`, `hasExistingResponse`, `aggregateResults`, `formatAnswerCsv`, `respondentLabel`

### Task 2: Migration + RLS

- [x] `204_site_questionnaires.sql` + text contract test (tables, enums, RLS, grants, no `GRANT ALL`)

### Task 3: Admin list, nav, settings card

- [x] i18n, hub row, icon, list page, create/archive actions

### Task 4: Admin editor

- [x] Metadata + question add/edit/archive/reorder; publish gates

### Task 5: Public fill + submit

- [x] `/q/[slug]`, login redirect, limit-one, thank-you `?done=1`

### Task 6: Results + CSV

- [x] Aggregations on server, Recharts, individual rows, CSV action

### Task 7: Landing

- [x] Shared section on home; omit when empty
