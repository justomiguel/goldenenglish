# Event email templates implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff edit the four event emails on the Notificaciones tab, with a per-flow copy for the two confirmation mails, and send those copies.

**Architecture:** Pure copy selection and HTML-escaped variable fill live in `src/lib/events/eventEmailCopy.ts`. Rows live in `event_email_templates`. Sends resolve flow, then event, then the institute template, and pass the finished subject and body into `sendBrandedEmail`.

**Tech Stack:** Next.js App Router, Supabase, TipTap email editor, Vitest, dictionaries en/es/pt.

## Global Constraints

- Confirmation keys that may have a `flow_id`: `events.registered`, `events.payment_approved`.
- `events.payment_rejected` and `events.reminder` are event-level only.
- Fallback: flow copy, then event copy, then institute `email_templates`, then the code default.
- Variables: `firstName`, `lastName`, `eventName`, `flowName`, `eventDate`, `eventLocation`. Escape values before `fillTemplate`.
- Locales: `es`, `en`, `pt`. Enrollment stores `registration_locale`.
- A failed send does not roll back enrollment or payment.
- Sanitize with `sanitizeEmailTemplateHtml`. Empty output is rejected.
- Admin only. Audit without the HTML body.
- Files stay at or under 250 lines. Spanish copy is neutral Latin American tuteo.

---

### Task 1: Pure selection and escaping

- [ ] Test flow-over-event, event fallback, reminder ignoring a flow id, and HTML escaping.
- [ ] Implement `pickEventEmailCopy` and `applyEventEmailVars`.

### Task 2: Persistence

- [ ] Migration `212_event_email_templates.sql`, attendee `registration_locale`, RLS, and a SQL assertion test.
- [ ] Append the same SQL to `masterdb.sql`.
- [ ] ADR `docs/adr/2026-10-event-email-templates.md`.

### Task 3: Save and resolve

- [ ] `loadResolvedEventEmail` reads copies and falls through to `loadEmailTemplate`.
- [ ] `saveEventEmailTemplateAction` sanitizes, rejects a flow on non-confirmation keys, audits, and revalidates.
- [ ] `sendBrandedEmail` accepts optional already-built content.
- [ ] `notifyAttendeeViaResend` resolves the event copy when `eventId` is set.

### Task 4: Sends

- [ ] Enrollment stores the locale and sends `events.registered`.
- [ ] Payment approval sends `events.payment_approved` only when the payment row changes.
- [ ] Payment rejection sends `events.payment_rejected`.
- [ ] The reminder cron sends `events.reminder` through the same resolver.

### Task 5: Notificaciones tab

- [ ] Replace the placeholder with subject, visual editor, locale, flow scope, variable chips, and a sample preview.
- [ ] Dictionary keys in en, es, and pt.
