# Admin home ops cards implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show mail usage against a monthly cap, event seats, cohort enrollments, today's classes, this week's trials, tight section seats, event waitlist, and event payments waiting for review on the institute admin home.

**Architecture:** A pure cap check and a pure date window feed one Postgres snapshot. `sendBrandedEmail` reads the month usage, refuses when the next mail would pass the cap, and writes `email_send_ledger` after Resend accepts. The home board gains widget ids and small cards. The cap is a `site_settings` value edited on the email settings form.

**Tech Stack:** Next.js App Router, Vitest, Supabase SQL, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Cap default is 5000. Valid staff values are integers from 1 to 100000.
- Mail window is the UTC calendar month. Count is `recipient_count` per accepted send.
- A send that would pass the cap does not call Resend. Code is `email_monthly_cap`.
- Seats are attendee rows with status other than `cancelled`.
- Trial "released" is status `released`, not open inventory.
- Today and the trial week use `analytics.timezone`. Week is Monday through Sunday.
- Classes and section seats use the current cohort only.
- Event payment review is `pending` and `gateway_provider` is null.
- Tier B desktop. No PWA tree.
- Copy in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- No backfill of past mails.

---

### Task 1: Cap math

- [ ] Add `src/__tests__/lib/email/emailMonthlyCap.test.ts`.
- [ ] Add `src/lib/email/emailMonthlyCap.ts`.
- [ ] Run `npx vitest run src/__tests__/lib/email/emailMonthlyCap.test.ts`.

### Task 2: Institute window

- [ ] Add `src/__tests__/lib/dashboard/adminHomeOpsWindow.test.ts`.
- [ ] Add `src/lib/dashboard/adminHomeOpsWindow.ts`.
- [ ] Run that test file.

### Task 3: Snapshot parser

- [ ] Add `src/__tests__/lib/dashboard/parseAdminHomeOpsSnapshot.test.ts`.
- [ ] Add `src/lib/dashboard/parseAdminHomeOpsSnapshot.ts`.
- [ ] Run that test file.

### Task 4: Ledger and snapshot SQL

- [ ] Add `supabase/migrations/250_email_send_ledger.sql`.
- [ ] Regenerate `supabase/migrations/masterdb.sql`.
- [ ] Apply with `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/250_email_send_ledger.sql`.

### Task 5: Send path

- [ ] Add `src/lib/email/emailSendLedger.ts`.
- [ ] Call it from `sendBrandedEmail`.
- [ ] Extend `sendBrandedEmail.test.ts` for allow, refuse, and ledger write.
- [ ] Run that test file.

### Task 6: Home widgets and cards

- [ ] Add widget ids, presets, labels, loader, and cards.
- [ ] Extend dictionaries.
- [ ] Update layout and extra-widget tests. Add a card smoke.
- [ ] Run those test files.

### Task 7: Cap setting

- [ ] Add `setEmailMonthlyCapAction` with audit and `revalidatePath`.
- [ ] Add the number field and `router.refresh()`.
- [ ] Test reject 0 and a valid save.
- [ ] Run that test file.

### Task 8: Docs

- [ ] Write `docs/adr/2026-11-04-admin-home-email-cap.md`.
- [ ] Prepend a product changelog entry.
