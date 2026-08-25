# Admin email send toggles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let institute admins turn each product email on or off from Settings, see today’s value, and have `sendBrandedEmail` honor that flag (password reset stays always on).

**Architecture:** One `site_settings.email_sends_enabled` JSON map. Pure helpers decide enabled. `sendBrandedEmail` skips Resend when off. Settings lists all registry keys; class-reminder toggle dual-writes `class_reminders_enabled`.

**Tech Stack:** Next.js App Router, Supabase `site_settings`, Vitest, existing admin Settings UI.

## Global Constraints

- 250-line file ceiling (`03-architecture.mdc`)
- `assertAdmin()` on writes (`04-security.mdc`)
- Audit setting changes (`08-analytics-observability.mdc`)
- Admin copy in `en.json` / `es.json` / `pt.json` (`09-i18n-copy.mdc`)
- Supabase clients only in `src/lib/supabase/` (`12-supabase-app-boundaries.mdc`)
- No SQL migration; missing map key = send on
- Class reminders missing `class_reminders_enabled` = off (existing parser)

---

### Task 1: Pure enable helpers

**Files:**
- Create: `src/lib/email/emailSendsEnabled.ts`
- Test: `src/__tests__/lib/email/emailSendsEnabled.test.ts`

**Interfaces:**
- Produces: `EMAIL_SENDS_ENABLED_KEY`, `CLASS_REMINDER_TEMPLATE_KEY`, `parseEmailSendsEnabled(value: unknown): Record<string, boolean>`, `isEmailSendEnabled(map, key): boolean`, `isProductEmailEnabled({ map, classRemindersEnabled, templateKey }): boolean`

- [x] Write failing tests then implement (TDD)

### Task 2: Send gate in `sendBrandedEmail`

**Files:**
- Create: `src/lib/email/loadEmailSendGate.ts`
- Modify: `src/lib/email/templates/sendBrandedEmail.ts`
- Test: `src/__tests__/lib/email/templates/sendBrandedEmail.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers
- Produces: `loadEmailSendGate(): Promise<{ map; classRemindersEnabled }>` (fail-open on read error: `{}` + `classRemindersEnabled: true`); `SendBrandedEmailInput.emailSendGate?`; result `| { ok: true; skipped: true }`

- [x] TDD: disabled key does not call `sendEmail`

### Task 3: Admin save action

**Files:**
- Create: `src/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions.ts`
- Test: `src/__tests__/app/setEmailSendEnabledAction.test.ts`

**Interfaces:**
- Produces: `setEmailSendEnabledAction({ locale, templateKey, enabled }): Promise<{ ok: boolean }>` — assertAdmin, reject unknown key, merge map, dual-write class reminders, audit `{ templateKey, enabled }`

- [x] TDD action cases

### Task 4: Churn cron + retention + overdue

**Files:**
- Modify: `src/app/api/cron/churn-inactivity/route.ts`
- Modify: `src/app/[locale]/dashboard/admin/academic/retentionEmailActions.ts`
- Modify: `src/types/retentionContactEmail.ts`
- Modify: `src/lib/academics/adminRetentionTableHelpers.ts`
- Modify: `src/lib/email/billingPaymentEmails.ts` (`notifyOverdueBalance` returns `{ outcome: "ok" | "disabled" }`)
- Modify: `src/app/[locale]/dashboard/admin/finance/collections/overdueBalanceRemindersAction.ts`
- Test: extend retention + sendBrandedEmail / overdue action tests

- [x] Disabled churn does not stamp `churn_notified_at`
- [x] Retention `DISABLED`; overdue counts skipped

### Task 5: Settings UI + i18n + tour

**Files:**
- Create: `src/lib/email/buildEmailSendsAdminGroups.ts`
- Create: `src/lib/settings/loadEmailSendsAdminPageModel.ts`
- Create: `src/components/dashboard/EmailSendsAdminSettingsForm.tsx`
- Modify: settings page, `ClassRemindersAdminSettingsForm`, dictionaries, `adminTourAnchors`, settings tour def
- Test: groups helper + form

- [x] Card between inscriptions and class reminders; per-row toggle; class-reminder checkbox removed from the extras form
