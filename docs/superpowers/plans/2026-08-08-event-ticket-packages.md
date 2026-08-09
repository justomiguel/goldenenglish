# Event Ticket Packages + Multi-Ticket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an event sell several named packages at different prices with their own benefits and their own capacity, and let one registration buy more than one seat (a titular plus companions), without touching how money is actually charged.

**Architecture:** A new `event_ticket_packages` child table, opt-in per event: an event with at least one active package is "in package mode" and its price comes from the package instead of the residency tiers. Multi-ticket reuses the existing attendee row as the unit of capacity — a purchase becomes one titular row plus N companion rows pointing at it through `primary_attendee_id`. The payment stays on the titular with the full amount, so `event_payments`, both gateways and the whole review panel keep working untouched. Everything that decides a price or a seat count is computed inside the enroll RPC or on the server; the client's total is decoration.

**Tech Stack:** Next.js 16 App Router, React, Tailwind (CSS variables), Supabase Postgres + RLS, PL/pgSQL, Zod, Vitest + React Testing Library, Playwright, ExcelJS.

**Spec:** `docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md` (§1.1, §3.1–§3.4, D1–D7, A1–A3)

## Deviations from the spec, decided while planning

Each of these came out of reading the current code and is deliberate. Anything not listed here follows the spec.

| # | Spec said | This plan does | Why |
|---|---|---|---|
| P1 | Migrations `178`, `179` | Migrations **`183`** (schema), **`184`** (RPC) and **`185`** (aggregates) | `177`–`182` are taken (parallel work, the student-care plan and the section enrollment link). Shifted by one from the numbers first planned, because `182` was claimed while this plan was being written. |
| P2 | Event capacity counts **all non-cancelled** attendee rows | Capacity counts rows with `status IN ('confirmed','pending_payment')`, exactly as today | The current RPC deliberately lets `waitlist` rows **not** consume capacity — that is what makes a waitlist a waitlist. Following the spec literally would mean the first waitlisted person permanently occupies a seat, silently changing behaviour for every existing event. |
| P3 | Package archived via `is_active BOOLEAN` (also A2) | Archived via **`archived_at TIMESTAMPTZ`** | The spec itself says the RLS must mirror `event_form_fields`, and that table archives with `archived_at`. Using the same column makes the RLS policy a literal copy instead of a near-copy, which is where subtle policy bugs come from. Reversible if you prefer `is_active`. |
| P4 | (not mentioned) | The RPC's duplicate-document check applies to **titulars only** | Today it rejects any attendee whose `dni_or_passport` already exists for the event, in **any** status. Left alone, a companion sharing a document rule with titulars would collide with the new partial unique index and the two checks would disagree. |
| P5 | (not mentioned) | The minor/tutor requirement applies to the **titular only**; companions never trigger it | The titular is the person responsible for the purchase. Demanding a guardian block per companion would make a parent buying three children's tickets fill the same tutor data three times. |
| P6 | (not mentioned) | `event_form_fields.collect_for_companions` means the RPC also writes `event_attendee_field_values` rows **per companion**, from a per-companion `field_values` array | The spec adds the column but never says where the answers land. Without this the toggle would be inert. |
| P7 | "reorder" among the admin package CRUD | Reorder via explicit **up/down buttons** | There is no drag-and-drop anywhere in this codebase; the `GripVertical` icon in the form-fields editor is decorative and has no handler. Inventing DnD here would be the only instance in the app. |
| P8 | Only `dni_or_passport` loses `NOT NULL` | `event_attendees.email` loses it too | Found while writing the migration: `email` is `TEXT NOT NULL` (migration 137). Since giving an email is a per-event companion toggle (D7), a companion at an event that does not collect it would violate the constraint and the whole purchase would fail. The RPC still demands an email from the titular, who is who every notification goes to. **Consequence to watch:** any code that reads `attendee.email` and assumes a string must tolerate null once companion rows exist — checked in Tasks 13 and 16. |

## Global Constraints

- **Spec authority:** D1 (packages opt-in per event; in package mode the price comes from the package and residency stops affecting the amount but is still recorded), D2 (package mode is inferred from having ≥1 active package — no `pricing_mode` column), D3 (benefits are an ordered `TEXT[]`), D4 (titular + companions via `primary_attendee_id`; payment stays on the titular), D5 (one package per registration, N identical seats), D6 (partial availability rejects the whole group and reports what is left; zero availability waitlists the whole group), D7 (companions always give first and last name; DNI, birth date and email are per-event toggles), A1 (`DROP FUNCTION` + `CREATE` with defaulted parameters), A2 (no data deleted; the DNI uniqueness swap happens inside one migration), A3 (package names and benefits are not translated).
- **Identifiers use `ticketPackage`, never `package`** — `package` is a reserved word in strict-mode ES/TS.
- **Money is never trusted from the client.** Every amount is recomputed server-side from the database. The total the public form shows is informational.
- **No user-visible literals in components.** Every string comes from `src/dictionaries/en.json` + `es.json` + `pt.json`, identical key shape (rule `09-i18n-copy.mdc`).
- **Server-side authorization only** (rule `04-security.mdc`); Supabase only through `src/lib/supabase/` factories (rule `12-supabase-app-boundaries.mdc`).
- **Bounded queries**, server-side pagination with `range` + `count` on the same filter (rule `13-postgrest-pagination-bounded-queries.mdc`); list filter counts come from an RPC (rule `24`).
- **Post-mutation refresh:** `revalidatePath` server-side plus `router.refresh()` client-side (rule `27`).
- **Structured error logging** with the `[ge:server]` helpers, stable `scope` strings, no PII (rule `25`).
- **Migrations never destroy data** (rule `21-migrations-production-no-data-destruction.mdc`).
- **Buttons carry a leading Lucide icon** plus an accessible name (rule `16`); no native dialogs (rule `18`); files under 250 lines (rule `03`); tests self-contained (rule `30`).
- **Commands:** `npx vitest run <path>`, `npm run lint`, `npx tsc --noEmit`.

---

### Task 1: Migration 182 — packages table, attendee and event columns

**Files:**
- Create: `supabase/migrations/183_event_ticket_packages.sql`
- Test: `src/__tests__/db/event_ticket_packages_migration.test.ts`

**Interfaces:**
- Produces: table `public.event_ticket_packages`; `event_attendees.ticket_package_id` and `.primary_attendee_id`; `events.allow_multiple_tickets`, `.max_tickets_per_registration`, `.companion_collect_dni`, `.companion_collect_birth_date`, `.companion_collect_email`; `event_form_fields.collect_for_companions`.

**Context:**
- The constraint to swap is really named `event_attendees_event_dni_unique` (migration 137, inline in `CREATE TABLE`). Confirmed — drop it by that name.
- `event_attendees.dni_or_passport` is `TEXT NOT NULL` today; companions may not have one, so the `NOT NULL` goes.
- `set_updated_at()` is the shared trigger function (migration 001). Convention: `DROP TRIGGER IF EXISTS <table>_set_updated_at` then `CREATE TRIGGER ... BEFORE UPDATE ... EXECUTE FUNCTION public.set_updated_at()`.
- The RLS to mirror is `event_form_fields_select_public_or_admin` + `event_form_fields_modify_admin` (migration 138). Copy their shape exactly.

- [ ] **Step 1: Write the failing test.** Assert: the table exists with the `benefits TEXT[]`, `price >= 0` and `capacity > 0` checks; both RLS policies exist and the SELECT one requires the parent event `published` and `archived_at IS NULL`; the `updated_at` trigger; the attendee columns with `ON DELETE RESTRICT` on the package FK and `ON DELETE CASCADE` on `primary_attendee_id`; `dni_or_passport` loses `NOT NULL`; the old unique constraint is dropped **and** the partial unique index is created in the same file; the `events_multi_ticket_max_required` check; and no `DROP TABLE` / `TRUNCATE` / `DELETE FROM`.

- [ ] **Step 2: Write the migration.**

```sql
-- Event ticket packages: an event may sell several named tiers, each with its own
-- price, benefits and capacity. An event with at least one active package is "in
-- package mode" and its price comes from the package (D1/D2) — there is no
-- pricing_mode column to keep in sync.
-- Spec: docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md (§3.1)

CREATE TABLE IF NOT EXISTS public.event_ticket_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  capacity    INT NULL CHECK (capacity > 0),
  benefits    TEXT[] NOT NULL DEFAULT '{}',
  position    INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.event_ticket_packages.capacity IS
  'Seats for this package alone; null means only the event capacity applies.';
COMMENT ON COLUMN public.event_ticket_packages.benefits IS
  'Ordered bullets shown on the public card. Not translated (A3).';
COMMENT ON COLUMN public.event_ticket_packages.archived_at IS
  'Soft archive, same convention as event_form_fields. Archived packages are not sellable.';

CREATE INDEX IF NOT EXISTS event_ticket_packages_event_position_idx
  ON public.event_ticket_packages (event_id, position, created_at);

DROP TRIGGER IF EXISTS event_ticket_packages_set_updated_at ON public.event_ticket_packages;
CREATE TRIGGER event_ticket_packages_set_updated_at
  BEFORE UPDATE ON public.event_ticket_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.event_ticket_packages ENABLE ROW LEVEL SECURITY;

-- Mirrors event_form_fields_select_public_or_admin (migration 138).
DROP POLICY IF EXISTS event_ticket_packages_select_public_or_admin ON public.event_ticket_packages;
CREATE POLICY event_ticket_packages_select_public_or_admin ON public.event_ticket_packages
  FOR SELECT TO anon, authenticated
  USING (
    (
      archived_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = event_ticket_packages.event_id
          AND e.status = 'published'
          AND e.archived_at IS NULL
      )
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_ticket_packages_modify_admin ON public.event_ticket_packages;
CREATE POLICY event_ticket_packages_modify_admin ON public.event_ticket_packages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Attendees: which package a seat belongs to, and which titular bought it.
ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS ticket_package_id   UUID NULL
    REFERENCES public.event_ticket_packages (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS primary_attendee_id UUID NULL
    REFERENCES public.event_attendees (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.event_attendees.primary_attendee_id IS
  'Null for a titular. Set on a companion seat; cascade so a cancelled purchase takes its companions with it.';

-- A companion may not have a document, so the column stops being mandatory and
-- the per-event uniqueness applies only to titulars. Both halves live in this
-- one migration so there is never a window without duplicate protection (A2).
ALTER TABLE public.event_attendees ALTER COLUMN dni_or_passport DROP NOT NULL;
ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_event_dni_unique;
CREATE UNIQUE INDEX IF NOT EXISTS event_attendees_primary_dni_uniq
  ON public.event_attendees (event_id, dni_or_passport)
  WHERE primary_attendee_id IS NULL AND dni_or_passport IS NOT NULL;
CREATE INDEX IF NOT EXISTS event_attendees_primary_attendee_idx
  ON public.event_attendees (primary_attendee_id);

-- Multi-ticket settings.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS allow_multiple_tickets       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_tickets_per_registration INT NULL
    CHECK (max_tickets_per_registration > 1),
  ADD COLUMN IF NOT EXISTS companion_collect_dni        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_collect_birth_date BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_collect_email      BOOLEAN NOT NULL DEFAULT false;

-- "Unlimited" must never be implicit: allowing several tickets requires a maximum.
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_multi_ticket_max_required;
ALTER TABLE public.events
  ADD CONSTRAINT events_multi_ticket_max_required
  CHECK (NOT allow_multiple_tickets OR max_tickets_per_registration IS NOT NULL);

ALTER TABLE public.event_form_fields
  ADD COLUMN IF NOT EXISTS collect_for_companions BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.event_form_fields.collect_for_companions IS
  'When true the register form asks this question for every companion seat too.';
```

- [ ] **Step 3: Verify** `npx vitest run src/__tests__/db/event_ticket_packages_migration.test.ts`. **Do not apply the migration.**

---

### Task 2: Migration 183 — `enroll_event_attendee` with packages and companions

The riskiest task in the plan. The RPC is the only place that decides a seat's price and status, and it is called by every public registration.

**Files:**
- Create: `supabase/migrations/184_enroll_event_attendee_packages.sql`
- Test: `src/__tests__/db/enroll_event_attendee_packages_migration.test.ts`

**Interfaces:**
- Consumes: Task 1's columns.
- Produces: `enroll_event_attendee(...)` with two extra parameters and two extra return columns.

**Contract, precisely:**
- Start from the **current body**, which lives in `supabase/migrations/158_events_defer_payment_creation.sql` lines 18–252. Copy it and extend; do not rewrite from memory.
- `DROP FUNCTION` the old 18-argument signature, then `CREATE` the 20-argument one (A1). New parameters go **last**, both defaulted: `p_ticket_package_id UUID DEFAULT NULL`, `p_companions JSONB DEFAULT '[]'::jsonb`.
- Re-issue `REVOKE ALL ... FROM PUBLIC` and `GRANT EXECUTE ... TO anon, authenticated` for the **new** signature — the grants in migration 146 name the old argument list and will not carry over.
- `RETURNS TABLE` gains `seats INT` and `total_amount NUMERIC(12,2)` after the existing five columns. Existing columns keep their order and meaning.

**Order of checks inside the transaction** (the event row is already locked `FOR UPDATE`):
1. Everything the current function already validates, unchanged: event exists, event open, titular first/last name/email present, `private_to_section` membership, legal age and the tutor requirement. `dni_required` still applies to the **titular**.
2. Duplicate document: unchanged rule, but scoped to titulars — add `AND ea.primary_attendee_id IS NULL` to the existing `EXISTS` (P4).
3. Package mode. `v_has_packages := EXISTS (SELECT 1 FROM event_ticket_packages WHERE event_id = p_event_id AND archived_at IS NULL)`.
   - `p_ticket_package_id IS NOT NULL` and the event has no active packages → `'package_not_allowed'`.
   - `v_has_packages` and `p_ticket_package_id IS NULL` → `'package_required'`.
   - A package id that does not belong to this event or is archived → `'package_not_found'`.
4. Seats. `v_seats := 1 + COALESCE(jsonb_array_length(p_companions), 0)`.
   - `v_seats > 1` and `NOT allow_multiple_tickets` → `'multiple_tickets_not_allowed'`.
   - `v_seats > max_tickets_per_registration` → `'too_many_tickets'`. The maximum is never null when multiple tickets are allowed (Task 1's CHECK), so there is no unlimited branch.
   - Every companion must have a non-blank first and last name → `'companion_name_required'`.
5. Availability (D6). Event seats used = rows with `status IN ('confirmed','pending_payment')` — unchanged semantics, see P2. In package mode also count that package's rows the same way and take the tighter of the two remainders.
   - `v_remaining <= 0` → the whole group goes to `waitlist`.
   - `0 < v_remaining < v_seats` → **reject** with `'insufficient_seats'` and return `v_remaining` in `seats`. Never sell a partial group.
6. Price. `v_unit := package.price` in package mode, otherwise the existing residency resolution untouched. `v_total := v_unit * v_seats`.
7. Status. `v_total = 0` → `confirmed`, else `pending_payment`. Unchanged shape, now driven by the total.
8. Insert the titular with `ticket_package_id` and `primary_attendee_id = NULL`, then each companion with the same status, same `ticket_package_id`, `primary_attendee_id = <titular id>`, and `dni_or_passport` / `birth_date` / `email` only when the matching `companion_collect_*` flag is on. `is_local_resident` is still recorded on the titular (D1).
9. Custom field values: the titular's as today; per companion, insert the entries from that companion's own `field_values` array, restricted to fields with `collect_for_companions = true` (P6). Keep the existing `EXISTS` guard that the field belongs to this event and is not archived.
10. Payment rows stay deferred — no `event_payments` insert, `payment_id` is still `NULL::uuid` (migration 158's contract).
11. `result_code` keeps its current three values and gains `'insufficient_seats'` plus the package/seat rejection codes above.

- [ ] **Step 1: Write the failing test.** This is a text test like its siblings, so assert the contract that matters: the `DROP FUNCTION` precedes the `CREATE`; the two new parameters exist with defaults and are last; `GRANT EXECUTE` names the new 20-argument signature; the returns table has `seats` and `total_amount`; the availability count still filters `IN ('confirmed', 'pending_payment')` (a regression here silently breaks every waitlist); the duplicate check is scoped with `primary_attendee_id IS NULL`; there is no `INSERT INTO public.event_payments`; and no destructive DDL.

- [ ] **Step 2: Write the migration** following the contract above.

- [ ] **Step 3: Verify** the test file. **Do not apply the migration.**

---

### Task 3: Seat and price arithmetic (pure)

Everything that multiplies money lives here so it can be tested without a database, and so the server and the UI cannot disagree about the number.

**Files:**
- Create: `src/lib/events/resolveEventRegistrationTotal.ts`
- Modify: `src/lib/events/resolveEventPriceTier.ts`
- Test: `src/__tests__/lib/events/resolveEventRegistrationTotal.test.ts`
- Test: modify `src/__tests__/lib/events/resolveEventPriceTier.test.ts`

**Interfaces:**
- Produces:
  - `eventUsesPackages(activePackages: { id: string }[]): boolean`
  - `resolveEventSeatPrice(source: EventPriceSource, ticketPackage: { price: number } | null, isLocalResident: boolean): number | null` — the package price wins when there is one; otherwise today's residency resolution.
  - `resolveEventRegistrationTotal(input: { unitPrice: number | null; seats: number; allowMultipleTickets: boolean; maxTicketsPerRegistration: number | null }): { ok: true; seats: number; total: number } | { ok: false; reason: "seats_below_one" | "multiple_not_allowed" | "over_max" }`

The existing residency exports (`resolveEventLocalPrice`, `resolveEventNonLocalPrice`, `eventHasTieredPricing`, `resolveEventPriceForResidency`, `eventRequiresPayment`) stay exactly as they are — legacy events depend on them and six callers import them.

- [ ] **Step 1: Write the failing tests.** Cover: package price beats a residency tier and beats a `0`-priced tier; with no package the residency path is byte-for-byte the old behaviour; total = unit × seats; a free package with three seats totals zero; `seats < 1` rejected; `seats > 1` with `allowMultipleTickets: false` rejected; seats over the maximum rejected; seats exactly at the maximum accepted.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify** both test files.

---

### Task 4: Public price display gains a packages kind

**Files:**
- Modify: `src/lib/events/resolveEventPublicPriceDisplay.ts`
- Test: modify `src/__tests__/lib/events/resolveEventPublicPriceDisplay.test.ts`

Add a fourth member to the union, keeping the existing three untouched:

```ts
| {
    kind: "packages";
    currency: string;
    packages: {
      id: string;
      name: string;
      price: number;
      benefits: string[];
      remainingSeats: number | null;
    }[];
  }
```

- [ ] **Step 1: Write the failing test** — with active packages the kind is `"packages"` and preserves order; with none the existing `free` / `single` / `tiered` results are unchanged (this is the regression that matters, since every current event goes through here).
- [ ] **Step 2: Implement** and update the one runtime caller, `PublicEventPriceDisplay.tsx`.
- [ ] **Step 3: Verify.**

---

### Task 5: Package loaders

**Files:**
- Create: `src/lib/events/server/loadEventTicketPackages.ts`
- Test: `src/__tests__/lib/events/server/loadEventTicketPackages.test.ts`

**Interfaces:**
- Produces: `loadEventTicketPackages(supabase, eventId, opts?: { includeArchived?: boolean }): Promise<EventTicketPackageRow[]>` and, alongside it, the sold-seat count per package so the public cards can show availability.

Imitate `src/lib/events/server/loadEventTranslations.ts`: takes a `SupabaseClient` plus an id, one bounded `.select("id, name, price, capacity, benefits, position, archived_at")`, maps to a typed row, orders by `position` then `created_at`.

Seats sold per package must count `status IN ('confirmed','pending_payment')` — the same rule the RPC uses, or the public "3 left" will contradict what the RPC allows.

- [ ] **Step 1: Write the failing test** with a mocked client: ordering, archived excluded by default and included on request, `benefits` defaulting to `[]`, and the seat count using the same two statuses.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 6: The gateway amount must follow the seats

This is where a mistake costs real money, so it gets its own task.

**Files:**
- Modify: `src/lib/events/server/loadEventAttendeeGatewayContext.ts`
- Test: modify `src/__tests__/lib/events/server/loadEventAttendeeGatewayContext.test.ts`

Today the amount is one seat at one residency tier. It must become: package price (when the attendee has a `ticket_package_id`) or the residency price, multiplied by the number of seats in the purchase — the titular plus every attendee whose `primary_attendee_id` is the titular.

Two hard rules:
- A **companion** row must never produce a gateway context. Return `null` when `primary_attendee_id IS NOT NULL`, so no companion can start a checkout or materialise a second `event_payments` row. `event_payments.event_attendee_id` is UNIQUE per attendee, so without this guard a companion could open a parallel payment for the same purchase.
- The amount is still computed from the database only. Nothing from the request participates.

Four callers depend on this and all four must keep working: `startEventGatewayPaymentCore`, `uploadEventPaymentReceiptServer`, `upsertApprovedEventGatewayPaymentCore` and `reconcileEventGatewayPaymentReturn` (currency only).

- [ ] **Step 1: Write the failing tests** — a titular with two companions on a package priced at 5000 yields 15000; a titular with no companions and no package yields exactly today's residency amount (regression); **a companion yields `null`**; a titular whose companions were cancelled yields only the seats still counted.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify**, then run the three consuming test files to prove nothing downstream moved.

---

### Task 7: Enroll path — server and route

**Files:**
- Modify: `src/lib/events/server/enrollEventAttendeeServer.ts`
- Modify: `src/lib/events/validateEventAttendeePayload.ts`
- Modify: `src/app/api/events/[slug]/enroll/route.ts`
- Test: modify the enroll route and payload tests; add one for companion validation

`EnrollEventAttendeeServerInput` gains `ticketPackageId?: string | null` and `companions?: EventCompanionPayload[]`, passed through as `p_ticket_package_id` and `p_companions`. The result gains `seats` and `totalAmount`.

Zod must reject, at the route, anything the event does not allow — the RPC also rejects it, but an error message the user can read is better than a database `result_code`: a companion array longer than the event's maximum, companions at all when `allow_multiple_tickets` is false, a package id when the event has none, and a missing package id when it has some.

- [ ] **Step 1: Write the failing tests**, including the case that matters most: **a client sending its own price or total is ignored** — the payload has no such field and the RPC computes everything.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 8: Admin package CRUD

**Files:**
- Create: `src/app/[locale]/dashboard/admin/events/eventTicketPackageActions.ts`
- Modify: `src/app/[locale]/dashboard/admin/events/actions.ts` (re-export from the barrel)
- Test: `src/__tests__/app/eventTicketPackageActions.test.ts`

Copy the conventions of `eventFormFieldActions.ts` exactly: `requireAdminEventActor()`, `safeParse` returning `"validation_failed"`, `createAdminClient()`, `logSupabaseClientError`, `recordSystemAudit`, `revalidateEventFormSurfaces(locale, eventId)`, and the shared `EventMutationResult` return type.

Actions: `addEventTicketPackageAction`, `updateEventTicketPackageAction`, `moveEventTicketPackageAction` (up/down, per P7), `archiveEventTicketPackageAction`.

One rule worth stating in code: **archiving the last active package returns an event to residency pricing**, which changes what the public page charges. The archive action must therefore be audited with the resulting active-package count in its payload.

- [ ] **Step 1: Write the failing tests** — non-admin refused for each action; validation failures; a package belonging to another event refused; reorder swaps positions; archive sets `archived_at` and never deletes; audit called with the event id.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 9: Aggregates — seats and registrations are different numbers

**Files:**
- Create: `supabase/migrations/185_events_aggregates_seats.sql`
- Modify: the loaders that read these RPCs
- Test: `src/__tests__/db/events_aggregates_seats_migration.test.ts`

`events_admin_attendees_aggregates` and `events_admin_list_aggregates` currently count attendee **rows**. Once a purchase is several rows, "127 attendees" stops meaning "127 people registered" and starts meaning something the admin did not ask for. Both must return seats and registrations separately: registrations count rows with `primary_attendee_id IS NULL`, seats count all rows.

Keep every existing return column, with its current meaning, and add the new ones — the loaders read by name.

- [ ] **Step 1: Write the failing test**, then the migration, then update the loaders and their tests.
- [ ] **Step 2: Verify.**

---

### Task 10: Copy for packages and multi-ticket

**Files:**
- Modify: `src/dictionaries/en.json`, `src/dictionaries/es.json`, `src/dictionaries/pt.json`

`admin.events` is a **nested** namespace (unlike `admin.users`), so the spec's grouping fits: add `admin.events.packages.*` as a sibling of the existing `admin.events.pricing`, and `admin.events.multiTicket.*` next to `admin.events.form.collectBirthDate`. Public copy goes under `events.public.packages.*` and `events.register.companions.*`, both of which are nested groups already.

Needed, at minimum: package name/price/capacity/benefits labels and hints; the "pricing is disabled because this event sells packages" explanation; the multi-ticket toggle, maximum and companion-field toggles; the public card labels including remaining seats and sold out; the quantity picker; companion field labels; and the three rejection messages a buyer can actually hit — `insufficient_seats` (with the remaining count), `too_many_tickets` and sold out.

- [ ] **Step 1:** Draft the Spanish, confirm it with the user, then add all three locales.
- [ ] **Step 2: Verify** key-set parity across the three files and `npx tsc --noEmit`.

---

### Task 11: Admin packages tab

**Files:**
- Modify: `src/components/dashboard/admin/events/AdminEventDetailTabs.tsx` (add `"packages"` to `EventAdminTab` and to `EVENT_ADMIN_TAB_ORDER`, plus `TAB_ICONS` and `TAB_TOUR_ANCHORS`)
- Modify: `src/components/dashboard/admin/events/AdminEventDetailTabContent.tsx` (dispatch branch)
- Create: `AdminEventTicketPackagesPanel.tsx`, `AdminEventTicketPackageForm.tsx`, `AdminEventTicketPackageBenefitsEditor.tsx` in the same folder
- Modify: `src/lib/dashboard/events/loadAdminEventDetailPageModel.ts` (load packages for the new tab)
- Test: `src/__tests__/components/AdminEventTicketPackagesPanel.test.tsx`, and extend `AdminEventDetailTabs.test.tsx`

Tabs are URL-driven (`?tab=`, parsed by `parseEventAdminTab`) — unlike the user ficha. Adding a tab also needs `detail.tabs.packages` and `detail.tabLeads.packages` in the dictionary.

The benefits editor is a string-array add/remove/reorder; `EventFormFieldSelectOptionsEditor.tsx` is the existing component with that exact shape — copy it rather than inventing another.

- [ ] **Step 1: Write the failing tests** — the tab appears in order; the panel lists packages by position; add/edit/archive/move call the right action and then refresh; an archived package is not listed by default.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 12: Admin — disable flat pricing, add multi-ticket settings

**Files:**
- Modify: `src/components/dashboard/admin/events/AdminEventSummaryPricingForm.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventPricingFields.tsx` (an explanation when disabled)
- Create: `src/components/dashboard/admin/events/AdminEventMultiTicketSettingsForm.tsx`
- Create: `src/app/[locale]/dashboard/admin/events/eventMultiTicketSettingsActions.ts`
- Test: `src/__tests__/components/AdminEventMultiTicketSettingsForm.test.tsx`, plus a first test for the pricing form

`AdminEventPricingFields` already takes a single `disabled` prop applied to all four inputs, and the summary form passes `disabled={pending}`. It becomes `disabled={pending || hasActivePackages}`, with a sentence saying why — a greyed-out field with no explanation is how support tickets get written.

The multi-ticket form follows `EventFormCollectBirthDateToggle`: `useTransition`, server action, `router.refresh()`, not optimistic. It must not let an admin enable multiple tickets without a maximum, because the database CHECK would reject the write and the user would see a generic failure.

- [ ] **Step 1: Write the failing tests** — price inputs disabled with the explanation visible when packages exist and enabled when they do not; enabling the toggle without a maximum is blocked client-side with a readable message; a valid save calls the action and refreshes.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 13: Admin attendees — package column and companions inside the row

**Files:**
- Modify: `src/lib/dashboard/events/loadEventAttendeesPaginated.ts`
- Modify: `AdminEventAttendeesTable.tsx`, `AdminEventAttendeeTableRow.tsx`, `AdminEventAttendeeExpandedDetails.tsx`, `AdminEventAttendeesPanelParts.tsx`
- Test: extend `src/__tests__/components/AdminEventAttendeesTable.test.tsx` and `loadEventAttendeesPaginated.test.ts`

The list must keep showing **purchases**, not seats: filter to `primary_attendee_id IS NULL` and load each titular's companions with it. Otherwise a 4-seat purchase turns one line into four and the pagination count stops matching what an admin counts by eye.

The expandable row already exists (`expandedId` state in the table, a second `<tr>` with `colSpan={ADMIN_EVENT_ATTENDEES_BASE_COLUMN_COUNT + customFieldColumns.length}`). Companions render inside it with a seat counter. Remember to bump the base column count constant when adding the package column.

- [ ] **Step 1: Write the failing tests** — companions are not top-level rows; the titular row shows the package name and seat count; the expanded panel lists companions; `colSpan` still matches the header after the new column.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 14: Public event pages

**Files:**
- Create: `src/components/molecules/PublicEventPackageCards.tsx`
- Modify: `src/components/molecules/PublicEventPriceDisplay.tsx`, `PublicEventDetailPanel.tsx`, `PublicEventListCard.tsx`
- Modify: `src/lib/dashboard/events/loadEventForPublicLanding.ts`, `loadPublicEventsList.ts` (load packages)
- Test: `src/__tests__/molecules/PublicEventPackageCards.test.tsx`

The detail panel renders the price through `PublicEventPriceDisplay` inside a `MetaRow`; comparable cards do not belong in a meta row, so in package mode the panel renders `PublicEventPackageCards` as its own block and keeps the meta row for non-package events.

The list card shows a "from $X" using the cheapest active package. Note `events.public.priceTiered` already exists in the dictionary and is referenced nowhere — check whether it is the key you want before adding another.

- [ ] **Step 1: Write the failing tests** — cards show name, price, benefits in order and remaining seats; a sold-out package is visibly disabled with a reason; an event with no packages renders exactly what it renders today.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 15: Public register — package picker, quantity and companions

**Files:**
- Create: `src/components/organisms/EventRegisterPackagePicker.tsx`, `EventRegisterTicketQuantityPicker.tsx`, `EventRegisterCompanionFields.tsx`
- Modify: `src/hooks/useEventRegisterForm.ts`, `src/hooks/useEventRegisterSubmit.ts`, `src/components/organisms/EventRegisterForm.tsx`
- Test: `src/__tests__/components/EventRegisterCompanionFields.test.tsx`, `src/__tests__/hooks/useEventRegisterForm.test.ts`

Companion rows follow the controlled-array pattern of `SectionScheduleFields.tsx`: the hook owns the array, the child renders it and calls `onChange` with a new array. Changing the quantity resizes the array, keeping already-typed values for the seats that remain — a buyer who mistypes 4 and corrects to 3 should not lose the first two companions' names.

Two behaviours the current form has that must be preserved: `EventRegisterResidencyPicker` only renders when `event.hasTieredPricing`, and in package mode it should not render at all (D1 — residency stops affecting the amount); and the price line under the form is informational, so now it shows unit × seats with the same status.

- [ ] **Step 1: Write the failing tests** — picking a package updates the shown total; quantity beyond the maximum cannot be selected; companion fields appear once per extra seat and only ask what the event collects; shrinking the quantity keeps the remaining companions' values; a sold-out package cannot be selected; submitting sends `ticketPackageId` and the companion array.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.**

---

### Task 16: Export, and the full gate

**Files:**
- Modify: `src/lib/events/export/eventAttendeesExportTypes.ts`, `buildEventAttendeesExportTable.ts`, `loadEventAttendeesForExport.ts`
- Test: extend `src/__tests__/lib/events/export/buildEventAttendeesExportTable.test.ts`

The export has 15 fixed columns plus the dynamic custom fields. Add package name and a titular reference so a companion row can be traced to its purchase. Unlike the admin list, the export should include companion rows — a door list needs every person.

- [ ] **Step 1:** Export changes with their tests.

- [ ] **Step 2: Regression sweep.** `REGRESSION CHECK` on the four areas most likely to break silently:
  - every caller of `resolveEventPriceForResidency` still gets today's answer for an event with no packages;
  - `event_payments` still has exactly one row per purchase (the companion guard in Task 6);
  - the waitlist still triggers on the same condition as before (P2);
  - the admin attendee count still equals the number of purchases.

- [ ] **Step 3: Full local gate.**

```bash
npx tsc --noEmit
npm run lint
npx vitest run
```

- [ ] **Step 4: End-to-end.** Extend `e2e/critical-paid-event.spec.ts` — it already walks a paid registration end to end, which is exactly the path packages change. Add: an event with two packages; buy the cheaper one with two companions; assert the gateway is asked for unit × 3 and that only one payment row exists. Also assert that an existing single-price event in the same spec still behaves identically.

- [ ] **Step 5: Hand back.** Migrations are **not** applied and nothing is committed without an explicit go-ahead.

---

## Definition of done for this plan

- An admin can give an event several packages with their own price, benefits and capacity, reorder and archive them, and sees flat pricing disabled with an explanation while packages are active.
- An admin can allow several tickets per registration, set the maximum, and choose which fields each companion must provide.
- A buyer sees comparable package cards with availability, picks one, chooses a quantity within the maximum, fills only the companion fields the event asks for, and is charged unit price × seats in a single payment.
- Partial availability rejects the whole group and says how many seats are left; zero availability waitlists the whole group.
- A companion can never start a checkout, and a purchase can never produce more than one `event_payments` row.
- Events without packages behave exactly as they do today — pricing, waitlist, payments and the public pages all unchanged, proven by the regression checks in Task 16.
- The admin attendee list still counts purchases; capacity and the export count seats.
- `npx tsc --noEmit`, `npm run lint` and `npx vitest run` are clean.
