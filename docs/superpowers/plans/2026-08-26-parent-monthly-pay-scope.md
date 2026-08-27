# Parent monthly pay scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (this session: inline). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tutors pay one section or every payable section of a child for a month in a single checkout, after a review screen they can leave.

**Architecture:** Pure `listPayableParentMonthSections` drives the review list. Parent strip links to `/payments/review`. One receipt or one gateway charge writes one `payments` row per section. N>1 online checkouts persist `payment_monthly_checkout_bundles` and a `tuition-bundle:` / Flow `bundle_id` mapping.

**Tech Stack:** Next.js App Router, Supabase, Vitest, existing Flow / Mercado Pago monthly cores.

## Global Constraints

- Parent portal only; student strip stays inline pay.
- `en.json` + `es.json` + `pt.json` same shape; no hardcoded UI copy.
- Files stay under 250 lines.
- One `payments` row per `(student, section, month, year)`.
- Stale review totals are rejected.
- Exempt / 100% scholarship / zero amount never appear as payable.

---

### Task 1: Payable-set helper

**Files:**
- Create: `src/lib/billing/listPayableParentMonthSections.ts`
- Test: `src/__tests__/lib/billing/listPayableParentMonthSections.test.ts`

**Produces:** `listPayableParentMonthSections({ view, originSectionId, month, year, scope, useFullMonthAmount })` → `{ lines, total, currency }`

- [x] Tests then implementation (TDD in this session)

### Task 2: Gateway reference bundle kind

**Files:**
- Modify: `src/lib/billing/parseMonthlyGatewayReference.ts`
- Test: `src/__tests__/lib/billing/parseMonthlyGatewayReference.test.ts`

**Produces:** `{ kind: "bundle", bundleId }` for `tuition-bundle:<uuid>`

### Task 3: i18n + review UI + parent CTA

**Files:**
- Modify: dictionaries, `StudentMonthlyPaymentFocus`, strip/desktop/PWA, `ParentPaymentsEntry`
- Create: `src/app/[locale]/dashboard/parent/payments/review/page.tsx`
- Create: `src/components/parent/ParentMonthlyPaymentReviewScreen.tsx`
- Test: `src/__tests__/components/parent/ParentMonthlyPaymentReviewScreen.test.tsx`

### Task 4: Review confirm (receipt)

**Files:**
- Create: `src/app/[locale]/dashboard/parent/payments/reviewActions.ts`
- Create: `src/lib/billing/assertParentMonthlyReviewSnapshot.ts`
- Test: snapshot + receipt loop

### Task 5: Bundle checkout persist + finalize

**Files:**
- Create: `supabase/migrations/192_payment_monthly_checkout_bundles.sql`
- Create: `docs/adr/2026-08-parent-monthly-pay-bundle.md`
- Create: `src/lib/billing/finalizeMonthlyPaymentBundle.ts`
- Create: `src/lib/billing/startFlowMonthlyBundlePaymentCore.ts`
- Create: `src/lib/billing/startMercadoPagoMonthlyBundlePaymentCore.ts`
- Modify: Flow lookup + MP finalize to dispatch `kind === "bundle"`

---
