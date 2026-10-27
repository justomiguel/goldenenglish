# Event Interactive Seat Map and Reservations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional multi-floor 1000x1000 interactive seat map editor for admins and a clean vector seat picker for public event registrations with pending holds until manual payment review.

**Architecture:** Store floor and rectangular block geometry in `public.events.seat_map_config` (`JSONB`) and active per-seat holds in `public.event_seat_locks` with a `UNIQUE (event_id, seat_key)` constraint. Derive the four seat states (`free`, `reserved`, `pending`, `purchased`) in pure domain helpers, lock seats during enrollment, and release locks when staff reject or delete a payment or cancel/remove an attendee.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS design tokens, Supabase Postgres + Storage, Zod, Vitest, Testing Library.

## Global Constraints

- Maximum 250 lines per file (`.cursor/rules/03-architecture.mdc`).
- All visible copy in `src/dictionaries/{en,es,pt}.json` with neutral Latin American Spanish tuteo (`es-419`, `.cursor/rules/40-neutral-spanish-copy.mdc`).
- Design tokens only; no hardcoded hex/rgb values; leading Lucide icons on buttons (`.cursor/rules/01-design-system.mdc`, `.cursor/rules/16-admin-buttons-icons.mdc`).
- Additive migration in `supabase/migrations/220_event_seat_map.sql` and mirrored in `supabase/migrations/masterdb.sql` (`.cursor/rules/21-migrations-production-no-data-destruction.mdc`).
- Post-mutation UI refresh with `revalidatePath` + `router.refresh()` (`.cursor/rules/27-post-mutation-ui-refresh.mdc`).
- Structured logging via `[ge:server]` helpers and admin audit via `recordSystemAudit` (`.cursor/rules/08-analytics-observability.mdc`, `.cursor/rules/25-server-error-logging.mdc`).

---

### Task 1: Database Migration `220_event_seat_map.sql` & `masterdb.sql`

**Files:**
- Create: `supabase/migrations/220_event_seat_map.sql`
- Modify: `supabase/migrations/masterdb.sql`
- Test: `src/__tests__/db/event_seat_map_migration.test.ts`

- [ ] **Step 1: Write the failing migration test**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Create `supabase/migrations/220_event_seat_map.sql` and update `supabase/migrations/masterdb.sql`**
- [ ] **Step 4: Run the test to verify it passes**

---

### Task 2: Pure Domain Logic (`seatMapModel.ts` & `seatMapState.ts`)

**Files:**
- Create: `src/lib/events/seatMapModel.ts`
- Create: `src/lib/events/seatMapState.ts`
- Test: `src/__tests__/lib/events/seatMapModel.test.ts`

- [ ] **Step 1: Write the failing unit tests for grid generation, aisle splitting, guide image stripping, state resolution, and selection validation**
- [ ] **Step 2: Run Vitest to verify it fails**
- [ ] **Step 3: Implement `seatMapModel.ts` and `seatMapState.ts`**
- [ ] **Step 4: Run Vitest to verify all domain tests pass**

---

### Task 3: Server Persistence, Enrollment Seat Locking & Payment Review Release

**Files:**
- Create: `src/lib/events/server/eventSeatLocksServer.ts`
- Create: `src/app/[locale]/dashboard/admin/events/eventSeatMapActions.ts`
- Modify: `src/app/[locale]/dashboard/admin/events/actions.ts`
- Modify: `src/lib/events/server/enrollEventAttendeeServer.ts`
- Modify: `src/app/api/events/[slug]/enroll/route.ts`
- Modify: `src/lib/events/server/reviewEventPaymentServer.ts`
- Modify: `src/lib/events/server/deleteEventPaymentServer.ts`
- Modify: `src/app/[locale]/dashboard/admin/events/eventAttendeeActions.ts`
- Modify: `src/lib/dashboard/events/loadEventForPublicLanding.ts`
- Modify: `src/lib/dashboard/events/loadAdminEventDetailPageModel.ts`
- Modify: `src/lib/dashboard/events/loadEventPaymentsPaginated.ts`
- Modify: `src/lib/dashboard/events/loadEventAttendeesPaginated.ts`
- Modify: `src/lib/events/duplicateEventPlan.ts`
- Modify: `src/lib/events/server/duplicateEventServer.ts`
- Test: `src/__tests__/lib/events/server/eventSeatLocksServer.test.ts`

- [ ] **Step 1: Write the failing server unit tests for locking and releasing seats**
- [ ] **Step 2: Run Vitest to verify failure**
- [ ] **Step 3: Implement `eventSeatLocksServer.ts`, `eventSeatMapActions.ts`, and wire into enrollment, payment review, loaders, and duplication**
- [ ] **Step 4: Run Vitest to verify server tests pass**

---

### Task 4: Admin 1000x1000 Seat Map Editor, Public Seat Picker, Displays, Exports & i18n

**Files:**
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/pt.json`
- Modify: `src/components/dashboard/admin/events/AdminEventDetailTabs.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventDetailTabContent.tsx`
- Create: `src/components/dashboard/admin/events/seat-map/AdminEventSeatMapPanel.tsx`
- Create: `src/components/dashboard/admin/events/seat-map/AdminEventSeatMapCanvas.tsx`
- Create: `src/components/dashboard/admin/events/seat-map/AdminEventSeatBlockInspector.tsx`
- Create: `src/components/organisms/EventRegisterSeatPicker.tsx`
- Modify: `src/lib/events/buildEventEnrollRequestBody.ts`
- Modify: `src/lib/events/eventRegisterFormLabels.ts`
- Modify: `src/hooks/useEventRegisterPayment.ts`
- Modify: `src/hooks/useEventRegisterForm.ts`
- Modify: `src/hooks/useEventRegisterSubmit.ts`
- Modify: `src/components/organisms/EventRegisterForm.tsx`
- Modify: `src/app/[locale]/events/[slug]/register/page.tsx`
- Modify: `src/app/[locale]/events/vista-previa/[slug]/page.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventPaymentReviewRow.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventDetailPaymentsTab.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventAttendeeExpandedDetails.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventAttendeesPanelParts.tsx`
- Modify: `src/lib/events/export/eventAttendeesExportTypes.ts`
- Modify: `src/lib/events/export/buildEventAttendeesExportTable.ts`
- Modify: `src/app/[locale]/dashboard/admin/events/exportAttendeesAction.ts`
- Test: `src/__tests__/components/AdminEventSeatMapPanel.test.tsx`
- Test: `src/__tests__/components/EventRegisterSeatPicker.test.tsx`

- [ ] **Step 1: Write failing component tests for `AdminEventSeatMapPanel` and `EventRegisterSeatPicker`**
- [ ] **Step 2: Run Vitest to confirm failure**
- [ ] **Step 3: Add dictionary keys (`es`, `en`, `pt`) and implement Admin Editor, Public Seat Picker, and Attendee/Payment/Export displays**
- [ ] **Step 4: Run Vitest and `npx tsc --noEmit` to verify everything passes**
