# Registration cohort section assignment Implementation Plan

> **For agentic workers:** Implement on `main`. Spec: `docs/superpowers/specs/2026-11-02-registration-assign-configured-cohort-sections-design.md`.

**Goal:** Inscripciones assigns a lead only to sections of the web-inscriptions cohort, and shows a create-section link when that cohort has none.

**Architecture:** Load sections by `loadRegistrationCohortConfig().activeCohort`. Reject a foreign `sectionId` in assign, propose, and the accept-enroll action. The empty state is one link component used by the assign control and the accept picker. Desktop and PWA share those components.

**Tech stack:** Next.js server actions, Vitest, existing `CurrentCohortSection` shape.

---

### Task 1: Cohort gate

**Files:** `src/lib/register/assertSectionInInscriptionsCohort.ts`, `src/lib/academics/currentCohort.ts`, intake assign, propose core, new enroll action.

**Steps:**
1. Test that a section cohort id must equal the active inscriptions cohort.
2. Load sections with `loadCohortSections(client, cohortId)`.
3. Call the gate before assign, propose, and accept enroll.

### Task 2: Empty-state button

**Files:** section choices component, accept picker, page, dictionaries.

**Steps:**
1. Test that zero sections render a link to `/{locale}/dashboard/admin/academic/{cohortId}`.
2. Test that listed options are only the passed sections.
3. Pass the href from the registrations page into desktop and PWA.
