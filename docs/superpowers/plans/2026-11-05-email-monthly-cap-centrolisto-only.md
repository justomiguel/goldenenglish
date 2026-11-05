# Monthly mail readout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each institute's monthly mail count from its Resend key, read-only, on the CentroListo fleet and on the institute settings screen.

**Architecture:** A pure parser reads the Resend usage body. A server fetch calls `GET /usage` with the institute key. The fleet and the institute form receive only counts.

**Tech Stack:** Next.js, Vitest, Resend Usage API.

## Global Constraints

- The API key stays on the server.
- A missing key shows the Pulsar allowance.
- An unreadable key shows an unread line.
- Institute staff cannot save the cap.
- Copy lives in `en.json`, `es.json`, and `pt.json`.
- The fleet column is one shared table. Institute settings stay desktop-only.

### Task 1: Parser and fetch

**Files:**
- Create: `src/lib/email/resendMonthlyMail.ts`
- Create: `src/lib/email/fetchResendMonthlyMail.ts`
- Test: `src/__tests__/lib/email/resendMonthlyMail.test.ts`

- [ ] Parse `emails.monthly.used` and `limit`.
- [ ] Map a tenant key to a readout. No key means Pulsar. A failed usage call means unread.

### Task 2: Screens

**Files:**
- Modify: `src/components/dashboard/EmailSendsAdminSettingsForm.tsx`
- Modify: `src/components/organisms/pulsar/PulsarAdminFleetTable.tsx`
- Modify: `src/app/[locale]/admin/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/settings/page.tsx`
- Modify: `src/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions.ts`

- [ ] Institute form shows text only.
- [ ] The institute action rejects every caller.
- [ ] The fleet column shows the readout.
