# Join payment disposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline; user said implement). Steps use checkbox syntax.

**Goal:** At first section enroll, apply an explicit join billing disposition so prior cycle months are exempt and the join month is paid, owed, or scholarship.

**Architecture:** Pure planner + Zod schema + one `applyJoinBillingDisposition` helper (injected port) called after enroll. Trial convert quote sums matrícula + join-month tuition and seeds `current`.

**Tech Stack:** TypeScript, Zod, Vitest, Next.js server actions, Supabase `payments` / `section_enrollment_scholarships`.

## Global Constraints

- 250-line file ceiling (`03-architecture.mdc`)
- en + es copy; keep `pt.json` in the same shape (`09-i18n-copy.mdc`)
- No new `payment_status`; reuse `exempt` / approved-without-receipt / scholarships
- Self-contained tests under `src/__tests__/`
- Do not commit spec/plan alone; product commit includes changelog (`39-commit-product-changelog.mdc`)
- Mixed WIP in the tree: do not stash or bundle unrelated files

---

### Task 1: Cycle month planner

**Files:**
- Create: `src/lib/billing/planJoinBillingMonths.ts`
- Test: `src/__tests__/lib/billing/planJoinBillingMonths.test.ts`

**Produces:** `planJoinBillingMonths({ sectionStartsOn, sectionEndsOn, joinYear, joinMonth })` → `{ priorMonths, lastCycleMonth, joinIsBillable }`

- [x] Tests then implementation (TDD)

### Task 2: Disposition schema + preview

**Files:**
- Create: `src/lib/billing/joinBillingDispositionSchema.ts`
- Create: `src/lib/billing/formatJoinBillingPreview.ts`
- Test: `src/__tests__/lib/billing/joinBillingDispositionSchema.test.ts`
- Test: `src/__tests__/lib/billing/formatJoinBillingPreview.test.ts`

**Produces:** `joinBillingDispositionSchema`, `JoinBillingDisposition`, `formatJoinBillingPreview`

- [x] Tests then implementation

### Task 3: Trial convert quote sums both

**Files:**
- Modify: `src/lib/register/planTrialConvertQuote.ts`
- Test: `src/__tests__/lib/register/planTrialConvertQuote.test.ts`
- Modify: `src/components/register/TrialConvertScreen.tsx` (show both parts)
- Modify: `src/app/[locale]/unirse/[token]/page.tsx` if quote kind type widens

- [x] Tests then implementation

### Task 4: Apply seeder (port + supabase adapter)

**Files:**
- Create: `src/lib/billing/applyJoinBillingDisposition.ts`
- Create: `src/lib/billing/createJoinBillingDispositionPort.ts`
- Test: `src/__tests__/lib/billing/applyJoinBillingDisposition.test.ts`

**Produces:** `applyJoinBillingDisposition(port, input)` idempotent writes

- [x] Tests then implementation

### Task 5: Wire accept / intake / enroll / trial capture

**Files:**
- Modify: `acceptRegistrationHelpers.ts` schema
- Modify: `acceptRegistrationLead.ts`, `finalizeAcceptedRegistrationLead.ts`
- Modify: `acceptRegistrationAction.ts`
- Modify: intake actions + `enrollStudentInSectionAction`
- Modify: `applyTrialConvertGatewayCapture.ts`
- Modify: `registrationsActions.test.ts` (pass disposition; mock seeder)

- [x] Tests then implementation

### Task 6: Admin UI + i18n + changelog

**Files:**
- Create: `src/components/dashboard/AdminRegistrationJoinBillingFields.tsx`
- Test: `src/__tests__/dashboard/AdminRegistrationJoinBillingFields.test.tsx`
- Modify: accept form, intake actions, section picker
- Modify: `en.json`, `es.json`, `pt.json`
- Modify: `src/lib/product-changelog/catalog.ts`

- [x] Tests then implementation
