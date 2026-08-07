# Event ticket packages + registrations contact/tracking + student care notes

- **Date:** 2026-08-07
- **Status:** approved 2026-08-07 (user: "hagamoslo")
- **Plans:** `docs/superpowers/plans/2026-08-07-registrations-contact-followup.md`,
  `docs/superpowers/plans/2026-08-07-student-care-notes.md`,
  `docs/superpowers/plans/2026-08-07-event-ticket-packages.md`
- **Scope:** three independent features in one spec, at the user's explicit request:
  1. `/events/**` + `/dashboard/admin/events/**` — multi-package pricing and multi-ticket registration
  2. `/dashboard/admin/registrations/**` — contact data visible in the table + lead follow-up
  3. `profiles` care notes + `/dashboard/admin/users/[userId]` ficha + `/dashboard/parent/children/**`

---

## 1. Understanding

### 1.1 Events — one price per event, no packages

`events` carries a single `price` plus `price_local` / `price_non_local`, and the attendee's
`is_local_resident` picks the tier. `resolveEventPriceTier.ts` resolves it and
`loadEventAttendeeGatewayContext.ts` recomputes the amount **server-side** for Mercado Pago, Flow and
bank transfer — the client amount is never trusted. There is no way to offer "General / VIP / VIP with
dinner" with different benefits.

Two structural facts constrain the design:

- `event_attendees` has `UNIQUE (event_id, dni_or_passport)` and `dni_or_passport TEXT NOT NULL` —
  one row per person per event, DNI mandatory.
- `event_payments` has `UNIQUE (event_attendee_id)` — exactly one payment per attendee. Both gateway
  finalize paths (`finalizeEventPaymentFromMercadoPago.ts`,
  `finalizeEventPaymentFromFlowGateway.ts`), both finalize-record tables
  (`event_payment_flow_finalize_records`, `event_payment_mp_finalize_records`) and the admin payments
  panel all hang off that 1:1 relationship.

`price` and `price_local` are kept in sync **by hand** in `eventCrudActions.ts` (both written on every
create/update). That duplication is a latent desync bug and a warning against adding more redundant
pricing state.

### 1.2 Registrations — contact data loaded but not rendered

`loadPaginatedRegistrations.ts` already selects `phone`, `tutor_phone`, `tutor_email`, `tutor_name`,
`tutor_relationship`, but `AdminRegistrationsTableDesktop.tsx` renders only name, DNI, email, level,
birth date, received. **The phone is one `<td>` away and simply absent** — the admin has to open the
edit modal to read it. `preferred_section_id` is not even selected by the list loader.

There is no room for new columns as-is: the table is `table-fixed` with a `<colgroup>` of seven
columns summing 100%, and email alone takes 24%.

Follow-up tracking is half-built: `registration_status` has `'contacted'`, `useAdminRegistrationsList.ts`
translates it and all three dictionaries carry the label, but **nothing can set it** — there is no UI
and no server action. The status is read-only dead state.

There is a trap here. `AdminRegistrationTableRow.tsx` gates both edit and accept on
`status === "new"`, and `registrationDraftAction.ts` rejects any row whose status is not `'new'`.
Enabling "contacted" without touching those three gates means **marking a lead as contacted disables
editing and accepting it** — complying with the follow-up feature would break the primary workflow.

For minors the public form writes `phone: null` (`register/actions.ts`) and the real contact is
`tutor_phone`; the `email` is a **synthetic address** (`local@MAIL_TENANT`) that reaches nobody.

### 1.3 Students — no care data, and RLS that cannot be narrowed per column

Students are `profiles` rows with `role = 'student'`. There is no health, dietary, support, or
emergency field; `studentCsvMap.ts` explicitly `skip`s `observaciones` / `notas`.

`profiles` has additive SELECT policies that Postgres ORs together, including
`profiles_select_teacher_for_messaging` (migration 016 — every teacher reads every student row) and
`profiles_select_assistant_for_attendance` (migration 103 — every assistant reads every student row).
RLS is per **row**, so any new column is automatically included. Restricting three columns therefore
cannot be done with policies.

Postgres column privileges are the only mechanism, and they do not work subtractively: while a role
holds table-level `SELECT`, it reads every column. Migration 166 granted exactly that
(`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role`). The restriction
therefore requires revoking table-level `SELECT` and re-granting an **explicit allowlist of every other
column** — with the maintenance hazard that a future column omitted from that list becomes invisible
and breaks queries, and the second hazard that migration 166 set a precedent for blanket grants that
would silently re-open the restriction.

Verified enabler: no query in `src/**` does `select("*")` on `profiles`; every read names its columns
(rule `13-postgrest-pagination-bounded-queries.mdc`). The allowlist is therefore viable.

Existing convention to reuse: derived columns maintained by trigger (`age_years`, `is_minor`) and the
`profiles_block_minor_self_sensitive_update` trigger that stops a minor from editing their own
sensitive fields.

## 2. Decisions and assumptions

| # | Decision | Rationale |
|---|---|---|
| D1 | Packages are **opt-in per event**; an event is free, single-price (residency tiers as today), or package-based. With active packages the price comes from the package and residency stops affecting the amount, though `is_local_resident` keeps being recorded for reporting. | Zero data migration; existing events keep working untouched. |
| D2 | "Package mode" is **inferred** from having ≥1 active package — no `pricing_mode` column. | The `price`/`price_local` hand-sync is already a desync bug; adding more redundant state repeats it. |
| D3 | Benefits are an ordered `TEXT[]` on the package, not a child table. | A bullet has no attribute beyond its text and order. |
| D4 | Multi-ticket uses **titular + companions** (`event_attendees.primary_attendee_id`), not an `event_orders` table. The payment stays on the titular with the total amount. | Leaves `event_payments UNIQUE (event_attendee_id)`, both gateways, both finalize-record tables and the payments panel untouched. Money code is where a bug costs cash. |
| D5 | One registration carries **one package** with N identical seats. | Mixing packages in one purchase is what `event_orders` would enable; explicitly deferred (§7). |
| D6 | Partial availability **rejects the whole registration** and reports remaining seats. Zero availability waitlists the whole group. | Never charge for an incomplete group; the existing waitlist behaviour is preserved at the boundary. |
| D7 | Companions always give first and last name; DNI, birth date and email are per-event toggles; custom dynamic fields opt in via `collect_for_companions`. | Name is the minimum to identify a seat; anything more is the institute's call. |
| D8 | Registrations table shows **two phone columns** (student, tutor); email and birth date move to the expandable panel, with a "minor" marker next to the name. | Fixed 100% width has no slack; the minor email is synthetic and unusable, and neither email nor birth date drives a row action. |
| D9 | WhatsApp normalizes numbers with **`libphonenumber-js`**, taking the default country from the institute's already-configured `contact.phone` (`site_themes.properties`, exposed as `brand.contactPhone`, mandatory in the site-setup wizard). Unparseable numbers hide the WhatsApp action and offer only "copy". **Revised during planning** — the original design added a `whatsapp_default_country_code` setting plus a screen to edit it. | The country code already exists per tenant, so the setting and its admin UI were pure duplication. Hand-rolling this is a known trap: `0362 15 470-8145` and `+54 9 362 470-8145` are the same Argentine number. Still fails closed. |
| D9b | The retention table's WhatsApp link adopts the same normalizer in this change. | It currently sends `digitsOnly` output straight to `wa.me`, which is the same wrong-number bug; fixing it while already in that code is cheaper than a second pass. |
| D10 | Registrations gain `contacted_at` / `contacted_by`. | "Contacted" without who and when cannot drive call distribution or show which lead went cold. |
| D11 | Edit and accept gates widen from `'new'` only to `'new'` **or** `'contacted'` (row buttons **and** `registrationDraftAction`). | Otherwise the follow-up feature disables the primary workflow (§1.2). |
| D12 | Care data lives as columns on `profiles`, protected by a column-privilege allowlist plus a CI guard test. | User's explicit choice after being shown the maintenance cost; the guard test converts the hazard into a caught error. |
| D13 | A trigger-derived `has_care_notes` boolean stays **unrestricted**. | Staff get the badge through existing policies with no extra query, while the three note texts stay restricted. |
| D14 | Care detail reads go through a **single** server loader that authorizes admin, the student's tutor, or a teacher/assistant of a section the student is enrolled in (`section_enrollments`). | One door means one place where the access rule lives and is tested. |
| A1 | The new enroll RPC adds parameters **with defaults**, applied via `DROP FUNCTION` + `CREATE`. | Adding parameters cannot use `CREATE OR REPLACE`; defaults keep pre-deploy callers working between migration and app deploy. |
| A2 | No data is deleted or truncated; packages archive via `is_active`, and the DNI uniqueness swap happens inside one migration. | `21-migrations-production-no-data-destruction.mdc`; no window without duplicate protection. |
| A3 | Package names and benefits are **not** translated. | Confirmed out of scope; `event_translations` stays title/description/location only. |

Open questions: none blocking.

## 3. Proposed plan

**Migration numbering.** The three features ship as three independent plans in this order:
registrations (`176`), student care (`177`), event packages (`178`, `179`). The section headings below
keep the feature grouping; the numbers reflect that execution order.

### 3.1 Migrations 178–179 — event ticket packages

```sql
CREATE TABLE IF NOT EXISTS public.event_ticket_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(trim(name)) > 0),
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  capacity    INT NULL CHECK (capacity > 0),
  benefits    TEXT[] NOT NULL DEFAULT '{}',
  position    INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.event_ticket_packages (event_id, position);
```

RLS mirrors `event_form_fields`: `anon`/`authenticated` SELECT active packages of published,
non-archived events or admin; `authenticated` ALL for admin only. `updated_at` trigger as elsewhere.

Attendee and event changes:

```sql
ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS ticket_package_id   UUID NULL
    REFERENCES public.event_ticket_packages (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS primary_attendee_id UUID NULL
    REFERENCES public.event_attendees (id) ON DELETE CASCADE;

ALTER TABLE public.event_attendees ALTER COLUMN dni_or_passport DROP NOT NULL;
-- Named explicitly in migration 137; drop must not be silent (see §4).
ALTER TABLE public.event_attendees DROP CONSTRAINT event_attendees_event_dni_unique;
CREATE UNIQUE INDEX event_attendees_primary_dni_uniq
  ON public.event_attendees (event_id, dni_or_passport)
  WHERE primary_attendee_id IS NULL AND dni_or_passport IS NOT NULL;
CREATE INDEX ON public.event_attendees (primary_attendee_id);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS allow_multiple_tickets        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_tickets_per_registration  INT NULL CHECK (max_tickets_per_registration > 1),
  ADD COLUMN IF NOT EXISTS companion_collect_dni         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_collect_birth_date  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_collect_email       BOOLEAN NOT NULL DEFAULT false;

-- A maximum is mandatory whenever multiple tickets are allowed, so "unlimited" is never implicit.
ALTER TABLE public.events
  ADD CONSTRAINT events_multi_ticket_max_required
  CHECK (NOT allow_multiple_tickets OR max_tickets_per_registration IS NOT NULL);

ALTER TABLE public.event_form_fields
  ADD COLUMN IF NOT EXISTS collect_for_companions BOOLEAN NOT NULL DEFAULT false;
```

`COMMENT ON COLUMN` for each, per repo convention.

### 3.2 Migration 179 — `enroll_event_attendee` with packages and companions

`DROP FUNCTION` + `CREATE` (A1), adding `p_ticket_package_id UUID DEFAULT NULL` and
`p_companions JSONB DEFAULT '[]'`. Inside the existing single transaction:

1. Validate the package belongs to the event and `is_active`; reject unknown/inactive.
2. Reject a package id when the event has no active packages, and require one when it does.
3. `v_seats := 1 + jsonb_array_length(p_companions)`; reject if `allow_multiple_tickets = false` and
   `v_seats > 1`, or if `v_seats > max_tickets_per_registration`. The maximum is never null when
   multiple tickets are allowed (CHECK in §3.1), so there is no implicit "unlimited" branch.
4. Availability: event capacity counts **all** non-cancelled attendee rows (titular + companions);
   package capacity counts rows with that `ticket_package_id`. `v_remaining = 0` → whole group to
   `waitlist`; `0 < v_remaining < v_seats` → **reject** returning `v_remaining` (D6); else proceed.
5. Price: `v_unit := package.price` in package mode, else the current residency resolution.
   `v_total := v_unit * v_seats`.
6. Status: `v_total = 0` → `confirmed`, else `pending_payment`. Companions inherit the titular's
   status and `ticket_package_id`, and carry `primary_attendee_id`.
7. Payment rows stay deferred (migration 158 behaviour); the RPC returns
   `NULL::uuid AS payment_id` plus the new `seats` and `total_amount`.
8. Companion rows are inserted with `dni_or_passport` only when the event collects it.

### 3.3 Events — server and domain (`src/lib/events`)

- `resolveEventPriceTier.ts` gains `resolveEventSeatPrice(event, ticketPackage, isLocalResident)` and
  `eventUsesPackages(activePackages)`; residency helpers stay for legacy events. Identifiers use
  `ticketPackage`, never `package` — a future reserved word in strict-mode ES/TS.
- New `resolveEventRegistrationTotal.ts` (pure): unit price × seats, plus seat validation against
  `allow_multiple_tickets` / `max_tickets_per_registration`.
- `loadEventAttendeeGatewayContext.ts`: for a titular, amount = package price × seat count
  (titular + companions), still computed server-side. A companion row must **never** produce a
  gateway context or a payment — explicit guard and test.
- `resolveEventPublicPriceDisplay.ts` gains a `"packages"` kind carrying name, price, benefits and
  remaining seats per package.
- New `loadEventTicketPackages.ts` (public, bounded select) and admin CRUD in
  `eventTicketPackageActions.ts` (create / update / reorder / archive), audited per rule 08.
- `enrollEventAttendeeServer.ts` passes package and companions through; the enroll route validates
  with Zod, rejecting seat counts and package ids the event does not allow (never trusting the client).
- `events_admin_attendees_aggregates` / `events_admin_list_aggregates` return **seats** and
  **registrations** separately, so capacity reads true while the admin still sees purchase counts
  (rule 24).
- `eventAttendeesExportTypes.ts` + export actions gain package name and titular columns.

### 3.4 Events — UI

- Admin: `AdminEventTicketPackagesPanel` + `AdminEventTicketPackageForm` +
  `AdminEventTicketPackageBenefitsEditor` as a new tab in `AdminEventDetailTabs`.
  `AdminEventPricingFields` / `AdminEventSummaryPricingForm` disable the flat price inputs with an
  explanation when active packages exist.
- Admin: `AdminEventMultiTicketSettingsForm` for the multi-ticket toggle, maximum and companion field
  toggles, next to `EventFormCollectBirthDateToggle`.
- Admin attendees: package column; companions render **inside** the titular's expandable row
  (`AdminEventAttendeeExpandedDetails`) with a seat counter, so the list does not inflate. Payments
  panel shows package and seat count.
- Public: `PublicEventPackageCards` (comparable cards: name, price, benefits bullets, availability)
  replacing the single-price block on `PublicEventDetailPanel`; `PublicEventListCard` shows a
  "from $X" range.
- Public register: `EventRegisterPackagePicker`, `EventRegisterTicketQuantityPicker` and
  `EventRegisterCompanionFields` (repeated per extra seat) wired through
  `useEventRegisterForm` / `useEventRegisterSubmit`; the displayed total is informational only.
- Sold-out packages are disabled with a reason; the rejection from D6 surfaces the remaining count.

### 3.5 Migration 176 — registrations contact tracking

```sql
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contacted_by UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL;
```

Plus a `registrations_admin_list_aggregates(p_query TEXT)` RPC returning counts per status under the
active search (rule 24). No WhatsApp setting is needed — the country comes from the institute's
existing `contact.phone` (D9).

### 3.6 Registrations — server and UI

- `loadPaginatedRegistrations.ts`: add `preferred_section_id`, `contacted_at`, `contacted_by` to the
  column list and a status filter parameter; keep excluding `'enrolled'`.
- New `registrationStatusAction.ts` → `markRegistrationContacted` / `revertRegistrationToNew`,
  stamping `contacted_at` / `contacted_by`, audited, with `revalidatePath` + `router.refresh()`
  (rule 27).
- **Widen the gates (D11):** `AdminRegistrationTableRow` edit/accept conditions and
  `registrationDraftAction`'s status check both accept `'new'` and `'contacted'`.
- New pure `resolveRegistrationContact.ts`: effective student phone and tutor phone, plus the minor
  flag from `birth_date` + the existing `legalAgeMajority` prop.
- WhatsApp keeps the repo's existing link shape from the retention table
  (`adminRetentionTableHelpers.ts` `buildWhatsappHref` — `https://wa.me/<digits>?text=<encoded
  template>`, with the greeting coming from the dictionary so the admin does not retype it), but the
  number resolution moves to a new shared `src/lib/whatsapp/resolveWhatsAppDigits.ts` built on
  `libphonenumber-js`, with the default country parsed from `brand.contactPhone` (D9). The inline
  `digitsOnly` in `buildAdminRetentionRows.ts` is replaced by it (D9b).
- New `RegistrationContactCell` (phone text + WhatsApp + copy, Lucide icons per rule 16) and
  `AdminRegistrationExpandedDetails` (email, full tutor block, preferred section).
- The column set `AdminRegistrationsTableDesktop` passes to `UniversalListView` becomes: expand toggle,
  name (+ minor marker), DNI, student phone, tutor phone, level, status, received, actions — phones and
  status as `sortable: false`, with the `<colgroup>` rebalanced to 100%.
- `RegistrationListToolbar` gains status filter chips with counts from the new RPC.
- New `exportRegistrationsAction` following `exportUsersAction`, honouring active filters and
  including both phones and the tutor block.
- PWA variant (`AdminRegistrationsScreen` mobile tree) gets the same phones, WhatsApp action and
  status chip — the phone must be usable on the device you call from.

### 3.7 Migration 177 — student care notes

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_health_note  TEXT,
  ADD COLUMN IF NOT EXISTS care_diet_note    TEXT,
  ADD COLUMN IF NOT EXISTS care_support_note TEXT,
  ADD COLUMN IF NOT EXISTS care_updated_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS care_updated_by   UUID NULL
    REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_care_notes    BOOLEAN NOT NULL DEFAULT false;
```

- Trigger `profiles_sync_has_care_notes` (BEFORE INSERT/UPDATE) sets `has_care_notes` from whether any
  of the three notes is non-blank — same pattern as `age_years` / `is_minor`.
- Backfill `has_care_notes` in the same migration (all false today; keeps the migration idempotent).
- Extend `profiles_block_minor_self_sensitive_update` so a minor cannot edit their own care notes.
**Column privileges.** Migration 166 ran `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,
authenticated, service_role`, so both API roles hold **table-level** `SELECT` on `profiles` today.
Narrowing it means:

```sql
REVOKE SELECT ON public.profiles FROM authenticated, anon;
GRANT SELECT (<every column except the three care notes>) ON public.profiles TO authenticated, anon;
-- service_role is deliberately untouched: the authorized loader reads with createAdminClient().
```

`has_care_notes`, `care_updated_at` and `care_updated_by` stay granted (D13). Only `SELECT` is narrowed;
`INSERT` / `UPDATE` / `DELETE` keep their table-level grants so existing RLS write policies behave
unchanged.

Because this repo has precedent for blanket `GRANT ALL ON ALL TABLES` (migration 166), any future
migration repeating that statement would **silently** re-open the care columns. The migration carries a
comment saying so, and the guard test in §3.10 is what actually enforces it.

### 3.8 Student care — server and UI

- New `src/lib/students/care/loadStudentCareNotes.ts` — the single authorized door (D14): admin, the
  student's tutor via `tutor_student_rel`, or a teacher/assistant of a section the student is enrolled
  in via `section_enrollments`; reads with `createAdminClient()` and logs denials via
  `logServerAuthzDenied`.
- New `saveStudentCareNotesAction` (admin ficha) and the same three fields added to
  `updateWardProfile` (family portal), both stamping `care_updated_at` / `care_updated_by` and writing
  an audit record — sensitive cross-account writes with the service client, per rule 17.
- Ficha: `"care"` added to `AdminUserProfileTabId`, an entry in `buildAdminUserProfileTabs` next to
  `family` (students only), and `AdminUserCarePanel` with three inline-editable textareas plus a
  "last updated by / on" line.
- New `StudentCareBadge` (discreet, no detail) rendered next to the student name in the ficha hero,
  the attendance screen and the section roster, driven by `has_care_notes`.
- `studentCsvMap.ts` stays as-is: care notes are **not** importable from CSV in this change.

### 3.9 Copy

New keys in `en.json` + `es.json` + `pt.json`, identical shape (rule 09): `admin.events.packages.*`,
`admin.events.multiTicket.*`, `events.register.companions.*`, `events.public.packages.*`,
`admin.registrations.contact.*`, `admin.registrations.followUp.*`, `admin.users.care.*`,
`dashboard.parent.care.*`. `Dictionary` derives from `en.json`, so a missing key fails the build.

### 3.10 Tests (TDD, self-contained per rule 30)

- Pure: `resolveEventRegistrationTotal` (seat limits, totals), `resolveEventPriceTier` package paths,
  `resolveEventPublicPriceDisplay` packages kind, `resolveRegistrationContact`,
  `resolveWhatsAppDigits` (already-international number kept, local Argentine number with trunk prefix
  and `15` normalized to the same E.164 digits as its `+54 9` form, unparseable → `null`, institute
  phone without a country → `null`), care authorization predicate.
- `REGRESSION CHECK` on the retention table: `buildWhatsappHref` now resolves through the shared
  normalizer (D9b), so its existing tests are updated to assert normalized digits rather than raw ones.
- Boundary-mocked: `loadEventAttendeeGatewayContext` (amount = price × seats; **companion yields no
  context**), `loadEventTicketPackages`, `loadPaginatedRegistrations` status filter,
  `loadStudentCareNotes` (each allowed role, and denial for an unrelated teacher).
- RTL: package panel and picker, quantity + companion fields, registrations contact cell and
  expanded panel, status chip and filter, `AdminUserCarePanel`, `StudentCareBadge`.
- **Guard test (D12), against the local Supabase stack.** For every column of `profiles`, assert
  `has_column_privilege('authenticated', 'public.profiles', <col>, 'SELECT')` is `false` for the three
  care notes and `true` for every other column. `has_column_privilege` accounts for table-level grants,
  so this single assertion catches both failure modes: a future column omitted from the `GRANT`
  allowlist (breaks reads), and a future blanket `GRANT ALL ON ALL TABLES` re-opening the care columns
  (breaks confidentiality). Same assertion for `anon`.
- `REGRESSION CHECK` notes on existing event enroll, payment review and registrations tests.

## 4. Risks and mitigation

| Risk | Mitigation |
|---|---|
| Client manipulates price or seat count | Amount and seat validation are recomputed in the RPC and in `loadEventAttendeeGatewayContext`; the route validates package id and seats against the event with Zod. Test asserts a tampered payload is rejected. |
| Companion generates its own payment or double-charges | Companions carry `primary_attendee_id`; gateway context guard returns null for them, with an explicit test. `event_payments UNIQUE (event_attendee_id)` untouched. |
| Duplicate-DNI window while swapping uniqueness | Constraint drop and partial unique index creation in the same migration/transaction (A2). The constraint is dropped **by its real name** (`event_attendees_event_dni_unique`, migration 137) without `IF EXISTS`, so a rename would fail the migration loudly instead of leaving the old constraint silently in place blocking companions. |
| Capacity oversell with grouped seats | Availability and insert stay inside the existing RPC transaction; capacity counts rows, not registrations; all-or-nothing rejection (D6). |
| Legacy single-price events break | Package mode is inferred and opt-in (D1/D2); no data migration; existing residency tests kept green. |
| Old app code calling the RPC after migration | New parameters are defaulted; `DROP` + `CREATE` keeps the old call shape valid (A1). |
| Marking "contacted" disables edit/accept | D11 widens all three gates, with a test that a `contacted` row is still editable and acceptable. |
| WhatsApp opening a wrong number | Country code configurable per institute; action hidden when unresolvable (D9), covered by a unit test. |
| A future `profiles` column omitted from the `GRANT` allowlist | Guard test in §3.10 fails CI. |
| A future blanket `GRANT ALL ON ALL TABLES` silently re-opening the care columns (migration 166 set that precedent) | Same guard test asserts the negative privilege for `authenticated` and `anon`, so the regression fails CI rather than leaking quietly. Migration comment warns the next author. |
| Revoking `SELECT` breaks the admin/service reads | `service_role` is explicitly untouched, and no query in `src/**` does `select("*")` on `profiles` (verified) — every read names its columns. |
| Care notes leaking to unrelated staff | Column privileges + single authorized loader; test asserts an unrelated teacher is denied while `has_care_notes` stays readable. |
| Minor deleting their own allergy | `profiles_block_minor_self_sensitive_update` extended to the care columns, with a test. |
| PII in logs | Care and contact values never enter `meta`; only ids and stable scopes (rule 25). |
| 250-line file limit (`03-architecture.mdc`) | Each feature is split into pure resolver / loader / action / desktop / PWA / panel files as listed in §3. |

## 5. Definition of done

- [ ] An admin can define several packages per event with name, price, optional capacity, ordered
      benefit bullets, and archive one without deleting attendee history.
- [ ] The public event page compares packages with their benefits, price and availability; the
      registration form picks a package and the server charges that package's price.
- [ ] With multi-ticket enabled, a person registers up to the configured maximum in one purchase,
      filling the configured data per companion, and pays **one** amount covering every seat.
- [ ] Requesting more seats than remain rejects the whole registration and reports how many remain;
      no availability waitlists the whole group; no partial charge ever occurs.
- [ ] Free and single-price events (including residency tiers) behave exactly as before, with no data
      migration.
- [ ] The registrations table shows the student's phone and the tutor's phone without opening any
      modal, on desktop **and** on the PWA, each with WhatsApp and copy actions.
- [ ] A lead can be marked contacted, recording who and when; the status chip and a filter with
      counts are available; a contacted lead is still editable and acceptable.
- [ ] The registrations list exports to Excel/CSV honouring active filters and including both phones
      and the tutor block.
- [ ] A student ficha has a "Salud y cuidados" tab with health, dietary and support notes, editable by
      an admin and by the family from the parent portal, stamped with who updated it and when.
- [ ] Care detail is readable only by an admin, the student's tutor, or teachers/assistants of the
      student's sections — enforced at the database privilege level, not only in app code.
- [ ] Staff see a discreet badge that care notes exist on the ficha, attendance and roster, without
      the detail.
- [ ] A minor cannot edit their own care notes.
- [ ] All user-visible copy comes from `en`/`es`/`pt` dictionaries.
- [ ] `npm run lint`, `npx tsc --noEmit` and `npm run test` pass; new logic covered; precommit e2e
      gate green (rule 34).

## 6. Out of scope

- Mixing different packages in one registration (needs the `event_orders` model — see §7).
- Translating package names and benefits (A3).
- Per-package residency pricing (D1 replaces residency in package mode).
- Discount codes, promotions, early-bird pricing, refunds and partial cancellations.
- Transferring a seat between people, or editing a package after payment.
- Copying care notes into event attendee records (would move medical data outside the access control
  this spec builds).
- Care notes in CSV import/export.
- Emergency contact, medication, allergy, insurance and first-aid-authorization fields as separate
  columns — the three free-text notes cover the stated need.
- Redesign of the accept-registration flow, the payments panel layout, or the section roster.

## 7. Follow-ups worth a later spec

1. `event_orders` so one purchase can combine different packages, with the payment on the order.
2. Per-package early-bird / date-based pricing windows.
3. Automatic reminder to follow up leads contacted more than N days ago without acceptance.
4. Counting registration WhatsApp contacts the way retention already counts them
   (`enrollment_retention_flags.whatsapp_contact_count`, `recordRetentionWhatsappContactAction`).
5. Structured care fields (allergies, medication, emergency contact) once the free-text notes show
   what the institutes actually record.
6. A read-audit trail for care notes (who looked at a student's medical detail, not just who wrote it).
