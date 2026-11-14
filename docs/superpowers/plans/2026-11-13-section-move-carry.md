# Section move carry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Staff choose which agreements follow a student into the destination section, and one transaction applies that choice.

**Architecture:** A pure planner decides collisions and row updates. A Postgres function performs the enrollment move and those updates. The roster and the enrolled-registration panel open one modal and call the same server action.

**Tech Stack:** Next.js server actions, Vitest, Postgres RPC, dictionary copy in en/es/pt.

## Global Constraints

- Checked items leave the origin enrollment. Unchecked items stay.
- Finance boxes start checked. Attendance and grades start unchecked.
- A colliding payment is superseded, not deleted.
- A missing collision choice saves nothing and returns `carry_choice_missing`.
- Learning tasks, retention alerts, and class-reminder rows are not carried. Reminder jobs for the old enrollment are still cancelled.
- Do not create a second student profile.
- Visible copy lives in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
- The roster table and the narrow cards share one modal. Actions on the narrow surface are at least 44px.

---

### Task 1: Planner

**Files:**
- Create: `src/lib/academics/planSectionMoveCarry.ts`
- Test: `src/__tests__/lib/academics/planSectionMoveCarry.test.ts`

**Interfaces:**
- Produces: `DEFAULT_SECTION_MOVE_CARRY`, `listSectionMoveCollisions`, `planSectionMoveCarry`

- [x] Write the failing planner tests
- [x] Implement the planner until those tests pass

### Task 2: Failure sentences

**Files:**
- Create: `src/lib/academics/sectionMoveCarryFailureMessage.ts`
- Test: `src/__tests__/lib/academics/sectionMoveCarryFailureMessage.test.ts`
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json`

**Interfaces:**
- Produces: `sectionMoveCarryFailureMessage(code, detail, sentences, unknownTemplate)`

- [x] Test a known code, `carry_choice_missing` with a month, and an unknown code
- [x] Add the sentences

### Task 3: Transaction

**Files:**
- Create: `supabase/migrations/276_section_move_carry.sql`
- Create: `src/lib/academics/loadSectionMoveCarryFacts.ts`
- Create: `src/app/[locale]/dashboard/admin/academic/moveStudentSectionWithCarryAction.ts`
- Modify: `src/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction.ts`
- Test: `src/__tests__/app/moveRegistrationSectionAction.test.ts`

**Interfaces:**
- Consumes: `planSectionMoveCarry`
- Produces: `move_student_section_with_carry`, `moveStudentSectionWithCarryAction`, `previewSectionMoveCarryAction`

- [x] Add `payments.superseded_at` and the partial unique index
- [x] Move the enrollment and the chosen rows in one function
- [x] Call that function from both entry points after the existing guards

### Task 4: Menu

**Files:**
- Create: `src/components/organisms/SectionMoveCarryModal.tsx`
- Modify: `src/hooks/useAcademicSectionRosterMoves.ts`
- Modify: `src/components/organisms/AcademicSectionRosterTable.tsx`
- Modify: `src/components/dashboard/AdminRegistrationEnrolledPanel.tsx`
- Test: `src/__tests__/organisms/SectionMoveCarryModal.test.tsx`
- Test: `src/__tests__/components/dashboard/AdminRegistrationFunnelPanel.test.tsx`

- [x] Modal defaults and confirm payload
- [x] Roster opens the modal before save
- [x] Registration panel opens the same modal and sends the carry payload

### Task 5: Billing reads and ADR

**Files:**
- Modify: payment list and slot queries so a superseded row is not the current month
- Create: `docs/adr/2026-11-13-section-move-carry.md`
- Create: `supabase/pulsar-migrations/050_section_move_carry_changelog.sql`

- [x] Filter `superseded_at is null` on current-payment reads
- [x] Leave receipt-by-id reads able to open the archived row
