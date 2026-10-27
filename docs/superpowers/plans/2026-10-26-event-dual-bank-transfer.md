# Event Dual Bank Transfer Sources Implementation Plan

**Goal:** Enable two bank transfer destinations on events with configurable display/routing modes (`both`, `source_1`, `source_2`, `by_question`) and persist the attendee's chosen transfer destination across enrollment, admin review, and attendee exports.

**Architecture:** Additive Postgres migration (`219_event_dual_bank_transfer.sql`) adds `bank_transfer_sources_config JSONB` on `events` and `transfer_source_key`, `transfer_source_label`, `transfer_question_answer` on `event_attendees`. A pure module `src/lib/events/eventBankTransferSources.ts` handles parsing, sanitization, presentation resolution, and enrollment payload validation. UI components stay under 250 lines by extracting `AdminEventDualTransferFields` and `EventRegisterDualTransferSection`.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (Postgres), Zod, Vitest, Testing Library.

---

## Task 1: Database Migration & Schema Sync
- **Files:**
  - Create: `supabase/migrations/219_event_dual_bank_transfer.sql`
  - Modify: `supabase/migrations/masterdb.sql`
  - Test: `src/__tests__/db/event_dual_bank_transfer_migration.test.ts`
- **Steps:**
  1. Write migration contract test verifying columns and check constraint.
  2. Create `219_event_dual_bank_transfer.sql` adding `bank_transfer_sources_config JSONB NULL` on `public.events` and `transfer_source_key TEXT NULL`, `transfer_source_label TEXT NULL`, `transfer_question_answer TEXT NULL` on `public.event_attendees`.
  3. Mirror changes in `supabase/migrations/masterdb.sql`.

## Task 2: Pure Domain Logic (`eventBankTransferSources.ts`)
- **Files:**
  - Create: `src/lib/events/eventBankTransferSources.ts`
  - Modify: `src/lib/events/eventRegisterPaymentView.ts`
  - Modify: `src/lib/events/duplicateEventPlan.ts`
  - Test: `src/__tests__/lib/events/eventBankTransferSources.test.ts`
- **Steps:**
  1. Write unit tests for `parseEventBankTransferSourcesConfig`, `sanitizeEventBankTransferSourcesConfig`, `resolveEventTransferPresentation`, and `validateEventTransferSelection`.
  2. Implement `src/lib/events/eventBankTransferSources.ts`.
  3. Update `eventRegisterPaymentView.ts` and `duplicateEventPlan.ts` (+ existing tests).

## Task 3: Server Loaders, Actions, and Enroll Endpoint
- **Files:**
  - Modify: `src/lib/dashboard/events/loadEventForPublicLanding.ts`
  - Modify: `src/lib/dashboard/events/loadAdminEventDetailPageModel.ts`
  - Modify: `src/lib/dashboard/events/loadEventPaymentsPaginated.ts`
  - Modify: `src/lib/dashboard/events/loadEventAttendeesPaginated.ts`
  - Modify: `src/app/[locale]/dashboard/admin/events/eventCrudActions.ts`
  - Modify: `src/lib/events/server/duplicateEventServer.ts`
  - Modify: `src/lib/events/server/enrollEventAttendeeServer.ts`
  - Modify: `src/app/api/events/[slug]/enroll/route.ts`
  - Test: `src/__tests__/lib/events/server/enrollEventAttendeeDualTransfer.test.ts`
- **Steps:**
  1. Write tests for enrollment persistence and validation of dual transfer selections.
  2. Extend loaders, admin CRUD actions (with `recordSystemAudit`), and enroll route/server helper.

## Task 4: Admin Event Pricing UI & Public Registration Form UI + Exports & i18n
- **Files:**
  - Modify: `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/dictionaries/pt.json`
  - Create: `src/components/dashboard/admin/events/AdminEventDualTransferFields.tsx`
  - Modify: `src/components/dashboard/admin/events/AdminEventPricingFields.tsx`
  - Modify: `src/components/dashboard/admin/events/AdminEventSummaryPricingForm.tsx`
  - Modify: `src/components/dashboard/admin/events/AdminEventDetailSummaryTab.tsx`
  - Create: `src/components/organisms/EventRegisterDualTransferSection.tsx`
  - Modify: `src/hooks/useEventRegisterForm.ts`
  - Modify: `src/hooks/useEventRegisterSubmit.ts`
  - Modify: `src/components/organisms/EventRegisterForm.tsx`
  - Modify: `src/components/dashboard/admin/events/AdminEventPaymentReviewRow.tsx`
  - Modify: `src/components/dashboard/admin/events/AdminEventAttendeeExpandedDetails.tsx`
  - Modify: `src/lib/events/export/buildEventAttendeesExportTable.ts`
  - Test: `src/__tests__/components/EventRegisterDualTransferSection.test.tsx`, `src/__tests__/components/AdminEventDualTransferFields.test.tsx`
- **Steps:**
  1. Write component tests for `AdminEventDualTransferFields` and `EventRegisterDualTransferSection`.
  2. Implement components, wire hooks and forms, update payment/attendee rows and exports.
  3. Update changelog `src/lib/product-changelog/catalog.ts` and run full verification.
