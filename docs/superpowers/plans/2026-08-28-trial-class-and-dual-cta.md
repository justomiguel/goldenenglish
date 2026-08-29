# Trial Class and Dual Public CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Families can reserve a seat or book a trial class from the landing; trial leads stay in pre-inscriptions until they attend and pay matrícula or the current-month cuota.

**Architecture:** Extend `registrations` with `intent` plus child `registration_trial_seats`. Site setting `public_cta_mode` is on every tenant (no denylist). Trial offer + fee inherit from cohort to section like matrícula. Reuse `RegisterForm`; do not fork per tenant.

**Tech Stack:** Next.js App Router, Supabase Postgres, Zod server actions, Vitest, i18n (`en` / `es` / `pt`), existing guest checkout (Flow / MP / transfer), Vercel cron.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-28-trial-class-and-dual-cta-design.md`
- `28-tenant-register-surface.mdc` — do not fork `RegisterForm`; `intent` is a prop
- `03-architecture.mdc` — 250-line ceiling; split files
- `09-i18n-copy.mdc` — keys in `en.json`, `es.json`, and `pt.json`
- `12-supabase-app-boundaries.mdc` — user-scoped client in actions; service role only in cron / SECURITY DEFINER RPCs
- `21-migrations-production-no-data-destruction.mdc` — additive only
- `30-harness-self-contained-tests.mdc` — tests pass alone
- Next migration number is **196**
- Day-of-week is `0 = Sunday` (same as `sectionScheduleWeekdayKey` and `Date.getDay`)
- Trial visitors must **not** be written to `section_attendance`

## File map

**Create (slice A — foundation + CTA + admin offer)**

- `src/lib/settings/parsePublicCtaMode.ts`
- `src/lib/settings/getPublicCtaMode.ts`
- `src/lib/settings/resolveRegisterIntent.ts`
- `src/lib/register/resolveSectionTrialOffer.ts`
- `src/lib/register/nextTrialScheduledOn.ts`
- `src/components/dashboard/PublicCtaModeSettingsForm.tsx`
- `src/components/molecules/LandingPublicRegisterCtaLinks.tsx`
- `src/components/organisms/LandingPublicRegisterCtas.tsx`
- `supabase/migrations/196_trial_class_and_public_cta.sql`
- matching `__tests__` for each pure helper + migration + settings form

**Create (slice B — picker + trial submit + inbox badge)**

- `src/components/register/RegisterSectionPicker.tsx` (calendar/combo switch wrapping existing multi-select)
- `src/components/register/RegisterSectionWeekCalendar.tsx`
- trial submit path in `completePublicRegistrationSubmit` / `register/actions.ts`
- inbox badge + filter

**Create (slice C — attendance + cron + mails)**

- `src/lib/register/markTrialSeatAttendance.ts`
- `src/app/api/cron/trial-class-followup/route.ts`
- email registry keys from the spec

**Create (slice D — trial fee pay, reschedule, convert / first month)**

- `src/app/[locale]/clase-prueba/[token]/page.tsx`
- `src/app/[locale]/unirse/[token]/page.tsx`
- checkout ref prefixes `TRIAL-` / `JOIN-`

**Modify**

- Settings page + `settings/actions.ts`
- Cohort fee editor + section create/edit
- Landing heroes (classic, Mozarthitos, Zenit, Liora, Nago, Mi Mundo) — mount shared CTA links
- `register/page.tsx` — intent searchParam + redirect rules
- `list_registration_section_options` + open-seat RPCs — count held trial seats
- Dictionaries `en` / `es` / `pt`

---

### Task 1: Pure helpers (CTA mode, trial offer, next date, register intent)

**Files:**
- Create: `src/lib/settings/parsePublicCtaMode.ts`
- Create: `src/lib/settings/resolveRegisterIntent.ts`
- Create: `src/lib/register/resolveSectionTrialOffer.ts`
- Create: `src/lib/register/nextTrialScheduledOn.ts`
- Test: `src/__tests__/lib/settings/parsePublicCtaMode.test.ts`
- Test: `src/__tests__/lib/settings/resolveRegisterIntent.test.ts`
- Test: `src/__tests__/lib/register/resolveSectionTrialOffer.test.ts`
- Test: `src/__tests__/lib/register/nextTrialScheduledOn.test.ts`

**Interfaces:**
- `PublicCtaMode = "reserve" | "trial" | "both"`
- `parsePublicCtaMode(raw: unknown): PublicCtaMode` — missing/invalid → `"reserve"`
- `resolveRegisterIntent(input: { siteMode: PublicCtaMode; requested: string | null }): { kind: "ok"; intent: "reserve" | "trial" } | { kind: "redirect"; to: "reserve" | "trial" }`
- `resolveSectionTrialOffer(section: { offersTrial: boolean | null; trialFeeAmount: number | null }, cohort: { offersTrial: boolean; trialFeeAmount: number }): { offers: boolean; amount: number }`
- `nextTrialScheduledOn(now: Date, dayOfWeek: 0-6, startTime: "HH:MM", timeZone: string): string` — ISO date `YYYY-MM-DD` of the next occurrence in that TZ (today if the slot has not started yet)

- [ ] **Step 1:** Write failing tests for all four helpers
- [ ] **Step 2:** Run tests — expect FAIL (modules missing)
- [ ] **Step 3:** Implement minimal helpers
- [ ] **Step 4:** Run tests — expect PASS

### Task 2: Migration 196

**Files:**
- Create: `supabase/migrations/196_trial_class_and_public_cta.sql`
- Test: `src/__tests__/db/trial_class_and_public_cta_migration.test.ts`

Must include:

- `site_settings` key `public_cta_mode` (JSON string). Default `"reserve"`. If a `site_themes.template_kind` is `mozarthitos` | `espaciozenit` | `liora`, seed `"both"`. `ON CONFLICT DO NOTHING`.
- Recreate `site_settings_select_public` keeping every previous public key **plus** `public_cta_mode`: `inscriptions_enabled`, `initial_site_setup`, `billing_currency`, `bank_transfer_instructions`, `billing_model`.
- Cohort: `offers_trial BOOLEAN NOT NULL DEFAULT false`, `trial_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0` + nonneg CHECK
- Section: `offers_trial BOOLEAN NULL`, `trial_fee_amount NUMERIC(12,2) NULL` + nonneg CHECK
- `registrations.intent` default `reserve` + CHECK; trial token/snapshot columns from the spec
- Table `registration_trial_seats` with CHECKs and unique `(registration_id, section_id, scheduled_on)`
- No DROP TABLE / TRUNCATE / DROP COLUMN

- [ ] Write migration test first (string assertions like `178_section_billing_mode_migration.test.ts`)
- [ ] Write SQL
- [ ] Confirm test PASS

### Task 3: Settings — public CTA mode

**Files:**
- Create: `src/lib/settings/getPublicCtaMode.ts`
- Create: `src/app/[locale]/dashboard/admin/settings/publicCtaModeActions.ts` (or add `setPublicCtaMode` next to `setInscriptionsEnabled` if the actions file stays under 250 lines)
- Create: `src/components/dashboard/PublicCtaModeSettingsForm.tsx`
- Modify: settings page
- Dictionaries: `admin.settings.publicCta*`

Visible on **every** tenant. Three radios: reserve / trial / both.

- [ ] Test parse + action deny-when-not-admin (follow inscriptions action tests)
- [ ] Mount form on settings page
- [ ] i18n keys in en/es/pt

### Task 4: Landing dual CTA

**Files:**
- Create: `src/components/molecules/LandingPublicRegisterCtaLinks.tsx` (pure, takes `mode`)
- Create: `src/components/organisms/LandingPublicRegisterCtas.tsx` (async: load mode + `inscriptions_enabled`)
- Modify landings that currently link to `/register`
- Test: `src/__tests__/components/LandingPublicRegisterCtaLinks.test.tsx`

Rules:

- `reserve` → one link `/{locale}/register`
- `trial` → one link `/{locale}/register?intent=trial`
- `both` → both
- Hidden when inscriptions are off
- Liora primary must not label reserve as “clase de prueba”

- [ ] Failing link-count tests
- [ ] Implement + wire Mozarthitos, Zenit, Liora, classic hero, Nago, Mi Mundo

### Task 5: Register intent routing + form copy

**Files:**
- Modify: `src/app/[locale]/register/page.tsx` (read `searchParams.intent`, call `resolveRegisterIntent`, redirect)
- Modify: `RegisterForm` / surfaces — `intent` prop, trial shell title
- Dictionaries: `register.trial.*` / landing register shell

- [ ] Test resolveRegisterIntent already covers redirects
- [ ] Page uses it; trial copy on the same `RegisterForm`

### Task 6: Cohort / section “ofrece trial” + amount

**Files:**
- Modify: `AcademicCohortFeeDefaultsEditor` + `cohortFeeDefaultsActions`
- Modify: section create/edit fee editors
- Dictionaries under academic cohort/section

`0` = free. Toggle off = hidden from trial picker.

### Task 7: Calendar / combo section picker

Shared switch. Desktop default calendar; narrow default combo. Full = disabled on calendar, omitted from combo. Trial list filters `offers === true`.

### Task 8: Trial submit + child seats + inbox badge

Insert `intent=trial` + seats. No login. Admin inbox badge `(clase de prueba)`.

### Task 9: Teacher visitors + `markTrialSeatAttendance` + cron + mails

Do not write `section_attendance`. Cron every 5 minutes.

### Task 10: Trial-fee checkout, reschedule, convert (`/unirse`) + first month

Guest pages from the spec. One student / one tutor on convert. Existing DNI reuses profile.

---

**This session executes Tasks 1–5** so Mozarthitos / Zenit / Liora can show both buttons and the form can open as trial. Tasks 6–10 follow in the same branch.
