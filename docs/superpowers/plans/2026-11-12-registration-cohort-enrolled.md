# Inscripciones cohort filter and Inscritos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff filter the Inscripciones list by cohort, rename the first arrow to Pre-inscritos, and open a last arrow, Inscritos, that shows each student's section.

**Architecture:** Pure helpers decide cohort membership and the enrolled revert patch. The list loader applies the cohort and the `enrolled_in_section` filter. A new server action moves the section. A second new action drops the section and clears the matrícula payment. The existing `revertRegistrationFunnelStageAction` keeps refusing status `enrolled`, so the batch path cannot clear a payment.

**Tech Stack:** Next.js App Router, React, Supabase, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-12-registration-cohort-enrolled-design.md`

## Global Constraints

- Work on `main`. Do not create a branch or a worktree.
- Do not commit per task. One commit later, only when the user asks. That commit includes this spec, this plan, and the changelog row.
- Source files under `src/` stay at or under 250 lines (`readFileSync` split on `\n`).
- Visible copy goes in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- The first arrow is Pre-inscritos. The last arrow is Inscritos.
- Inscritos has no checkbox and no batch bar.
- Do not delete the student profile. Do not delete `section_enrollments` rows. Use `dropped` and `transferred`.
- `registrationFunnelStage` still returns `null` for status `enrolled`.
- Before the first `src/` edit, point `.cursor/sdd-gate0-approved` at this spec.
- The changelog file is `supabase/pulsar-migrations/041_registration_cohort_enrolled_changelog.sql`. `040` is already used.

## File map

- Create: `src/lib/register/registrationCohortMembership.ts`
- Create: `src/lib/register/registrationEnrolledRevert.ts`
- Modify: `src/lib/register/registrationFunnelStage.ts` — add `enrolled_in_section` to the stage list only.
- Modify: `src/lib/register/registrationInboxFilter.ts` — explicit filter for the new stage.
- Modify: `src/lib/register/countRegistrationInboxFilters.ts` — count the new stage.
- Modify: `src/lib/dashboard/loadPaginatedRegistrations.ts` and `src/lib/dashboard/loadRegistrationInboxCounts.ts` — cohort plus enrolled rows.
- Modify: `src/app/[locale]/dashboard/admin/registrations/page.tsx` — read `cohort`.
- Create: `src/components/molecules/RegistrationCohortSelect.tsx`
- Modify: `src/components/molecules/RegistrationListToolbar.tsx` — selector above the arrows. Hide the batch bar on `enrolled_in_section`.
- Modify: `src/components/molecules/RegistrationFunnelArrows.tsx` — last arrow label.
- Modify: desktop and narrow list rows so Inscritos shows the section name and no checkbox.
- Create: `src/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction.ts`
- Create: `src/app/[locale]/dashboard/admin/registrations/revertEnrolledRegistrationAction.ts`
- Modify: `src/components/dashboard/AdminRegistrationFunnelPanel.tsx` — Inscritos block. Split a child file if the panel would pass 250 lines.
- Modify: `en.json`, `es.json`, `pt.json`.

---

### Task 1: Cohort membership and enrolled revert patch

**Files:**
- Create: `src/lib/register/registrationCohortMembership.ts`
- Create: `src/lib/register/registrationEnrolledRevert.ts`
- Test: `src/__tests__/lib/register/registrationCohortMembership.test.ts`
- Test: `src/__tests__/lib/register/registrationEnrolledRevert.test.ts`

**Interfaces:**
- Produces: `registrationBelongsToCohort(input): boolean`
- Produces: `registrationEnrolledRevert(input): { ok: true, nextStage, clearPayment: boolean } | { ok: false, code: "enrolled_revert_failed" }`

`registrationBelongsToCohort` input:

```ts
{
  selectedCohortId: string;
  openCohortId: string;
  status: string;
  preferredSectionCohortId: string | null;
  activeSectionCohortIds: readonly string[];
}
```

Rules:

- Status `enrolled`: true when `activeSectionCohortIds` contains `selectedCohortId`.
- Any other status with a preferred-section cohort: true only when that cohort equals `selectedCohortId`.
- Any other status with no preferred-section cohort: true only when `selectedCohortId` equals `openCohortId`.

`registrationEnrolledRevert` input is a `RegistrationFunnelRow` plus `status: "enrolled"`. It refuses any other status with `enrolled_revert_failed`. For an enrolled lead it returns `clearPayment: registrationHasMatricula(row)`. `nextStage` is `awaiting_payment` when the lead has a matrícula and the mail was sent, `contacted` when the lead has a matrícula and the mail was not sent, and `awaiting_section` when the lead has no matrícula. Mail sent means `enrollmentFeeMailSentAt` is set or `intakeState` is `receipt_pending`.

- [ ] **Step 1: Write the failing tests from those rules.** Cover the open-cohort fallback, a preferred section in another cohort, an enrolled lead in the selected cohort, an enrolled lead in another cohort, and the three revert landings.
- [ ] **Step 2: Run** `npx vitest run src/__tests__/lib/register/registrationCohortMembership.test.ts src/__tests__/lib/register/registrationEnrolledRevert.test.ts` and confirm FAIL.
- [ ] **Step 3: Implement the two pure modules.**
- [ ] **Step 4: Re-run the same command.** Expected: PASS.

---

### Task 2: List stage, cohort query, and section name

**Files:**
- Modify: `src/lib/register/registrationFunnelStage.ts`
- Modify: `src/lib/register/registrationInboxFilter.ts`
- Modify: `src/lib/register/countRegistrationInboxFilters.ts`
- Modify: `src/lib/dashboard/loadPaginatedRegistrations.ts`
- Modify: `src/lib/dashboard/loadRegistrationInboxCounts.ts`
- Modify: `src/app/[locale]/dashboard/admin/registrations/page.tsx`
- Test: the existing funnel filter and inbox count tests, plus a loader test if one already exists.

Add `"enrolled_in_section"` at the end of `REGISTRATION_FUNNEL_STAGES`. Keep `registrationFunnelStage` returning `null` for status `enrolled`. Update `emptyRegistrationInboxCounts`.

`applyRegistrationFunnelFilter` must handle `enrolled_in_section` before the `awaiting_section` branch. That filter is `.eq("status", "enrolled")`. Do not also apply `.neq("status", "enrolled")` on this stage. The other stages keep that exclusion.

After the stage filter, keep only rows for which `registrationBelongsToCohort` is true. Resolve `preferredSectionCohortId` from `academic_sections.cohort_id`. Resolve `activeSectionCohortIds` from active `section_enrollments` joined to `academic_sections` for `accepted_student_id`. Attach the active section names in the selected cohort onto the row. Show both names when two sections are active. Paginate after the cohort filter. Page size stays 25.

`parseSearchParams` reads `cohort`. `resolveRegistrationCohortId(raw, cohorts, openCohortId)` returns `openCohortId` when `raw` is missing or unknown. Pass the resolved id into the loader and the counts.

The panel treats `row.status === "enrolled"` as `enrolled_in_section`.

- [ ] **Step 1: Extend the filter test.** `enrolled_in_section` calls `.eq("status", "enrolled")` and does not use the awaiting-section `or`.
- [ ] **Step 2: Run that test and confirm FAIL.**
- [ ] **Step 3: Implement the filter, the counts key, the loader cohort cut, and the page param.**
- [ ] **Step 4: Re-run the filter test and `src/__tests__/lib/register/registrationFunnelStage.test.ts`.** Expected: PASS. The enrolled row still returns `null` from `registrationFunnelStage`.

---

### Task 3: Selector, arrow labels, and no batch

**Files:**
- Create: `src/components/molecules/RegistrationCohortSelect.tsx`
- Modify: `src/components/molecules/RegistrationListToolbar.tsx`
- Modify: `src/components/molecules/RegistrationFunnelArrows.tsx`
- Modify: the desktop row and `src/components/pwa/molecules/AdminRegistrationPwaCard.tsx`
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json`

The select label comes from a new dictionary key. Options are cohort id plus name. Changing it writes `cohort` with `router.replace`, sets `page` to 1, and keeps the other query keys. The control is `min-h-11 w-full` on the narrow tree and sits above the arrows in `RegistrationListToolbar`. The settings tab does not render that toolbar.

Spanish labels: first arrow `Pre-inscritos`, last arrow `Inscritos`. English: `Pre-enrolled`, `Enrolled in a section`. Portuguese: `Pré-inscritos`, `Inscritos`.

Hide `RegistrationFunnelBatchBar` when `inboxFilter` is `enrolled_in_section`. Hide the row checkbox on that stage in both trees. The section name is a text cell, not a button.

- [ ] **Step 1: Assert the toolbar hides the batch bar for `enrolled_in_section` and shows the cohort select.**
- [ ] **Step 2: Run the toolbar test and confirm FAIL.**
- [ ] **Step 3: Implement the select, the labels, and the hidden batch controls.**
- [ ] **Step 4: Re-run the toolbar test.** Expected: PASS.

---

### Task 4: Move section and enrolled revert actions

**Files:**
- Create: `src/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction.ts`
- Create: `src/app/[locale]/dashboard/admin/registrations/revertEnrolledRegistrationAction.ts`
- Modify: `src/components/dashboard/AdminRegistrationFunnelPanel.tsx`
- Test: `src/__tests__/app/moveRegistrationSectionAction.test.ts`
- Test: `src/__tests__/app/revertEnrolledRegistrationAction.test.ts`
- Test: `src/__tests__/components/dashboard/AdminRegistrationFunnelPanel.test.tsx`

Move action, admin only:

- Same section as an active enrollment in the selected cohort returns `section_move_same`.
- A section outside the selected cohort returns `section_move_outside_cohort`.
- Otherwise set every active enrollment in that cohort to `transferred`, insert one `active` enrollment, leave `status` `enrolled`, and leave `fee_captured` and the paid columns unchanged.
- Audit `registration_section_move`. Revalidate the registrations path. Log `[ge:server]` with scope `moveRegistrationSection` on failure.

Revert action, admin only:

- Call `registrationEnrolledRevert`. A non-enrolled lead returns `enrolled_revert_failed`.
- Set each active enrollment in the selected cohort to `dropped`.
- When `clearPayment` is true, set `fee_captured` false and the three paid columns null. When it is false, leave those columns.
- Set `status` to `contacted`. Do not change `accepted_student_id`.
- Audit `registration_funnel_revert` with `from_stage: "enrolled_in_section"` and `to_stage`. Do not store the email.
- The old `revertRegistrationFunnelStageAction` test that refuses an enrolled lead must still pass.

Popup for `enrolled_in_section`:

- Step sentence names the current section names.
- The `stepCommit` button saves the move. The select lists other sections of the selected cohort only.
- Back opens one `ConfirmActionModal`. The fee body includes the payment-clear sentence and says the account stays. The no-fee body says there is no payment to clear and names the waiting-for-section return.
- Edit, delete, and close stay ghost.
- Each new code has its own sentence in the three dictionaries. An unknown code stays on screen.

- [ ] **Step 1: Write the action tests and one panel test for the fee confirm text, the no-fee confirm text, `section_move_same`, and an unknown code.**
- [ ] **Step 2: Run those tests and confirm FAIL.**
- [ ] **Step 3: Implement both actions and the popup branch.** Keep each file at or under 250 lines.
- [ ] **Step 4: Run the new tests plus `src/__tests__/app/revertRegistrationFunnelStageAction.test.ts`.** Expected: PASS.

---

### Task 5: Changelog row

**Files:**
- Create: `supabase/pulsar-migrations/041_registration_cohort_enrolled_changelog.sql`

```sql
insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-cohort-enrolled', '2026-11-12', 'registrations',
  'Inscripciones se mira por cohorte',
  'Registrations can be read one cohort at a time',
  'As inscrições podem ser lidas por turma',
  'La lista tiene un selector de cohorte. Pre-inscritos es la primera flecha e Inscritos muestra la sección.',
  'The list has a cohort selector. Pre-enrolled is the first arrow and Enrolled in a section shows the section.',
  'A lista tem um seletor de turma. Pré-inscritos é a primeira flecha e Inscritos mostra a turma.',
  0
) on conflict (id) do nothing;
```

Do not apply this file in the task.

## Spec coverage

- Cohort selector, URL fallback, list-tab only: Tasks 2 and 3.
- Membership rules: Task 1.
- Pre-inscritos and Inscritos labels, section name, no batch: Task 3.
- Move without touching payment: Task 4.
- One confirm, drop section, clear payment only when a matrícula exists, keep the account: Tasks 1 and 4.
- Old enrolled refusal stays: Task 4.
- Error sentences and unknown code: Task 4.
- Web and narrow share the toolbar and the panel: Tasks 3 and 4.
