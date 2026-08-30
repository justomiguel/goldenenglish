# All-tenant HTML email templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every app-sent email on every tenant goes out inside the branded HTML wrap (`wrapEmailHtml`).

**Architecture:** Catalogued mail uses `sendBrandedEmail`. Composer/ad-hoc bodies use `sendWrappedHtmlEmail`. Events and password-reset copy move into the template registry.

**Tech Stack:** Existing email registry, `wrapEmailHtml`, Resend `EmailProvider`, Vitest.

## Global Constraints

- Body fragments only — never wrap a full HTML document.
- No text-only send API.
- File size ≤ 250 lines.
- Self-contained tests.

---

## File map

| File | Role |
|------|------|
| `src/lib/email/templates/sendWrappedHtmlEmail.ts` | Wrap + send for ad-hoc HTML |
| `src/lib/email/templates/registryEvents.ts` | `events.*` defaults |
| `src/lib/email/templates/registryAuth.ts` | password reset + admin reset notice |
| `src/lib/email/templates/templateRegistry.ts` | Register new defs |
| `src/lib/events/server/notifyAttendeeViaResend.ts` | `sendBrandedEmail` |
| `src/lib/auth/sendPasswordResetEmail.ts` | `sendBrandedEmail` |
| `src/lib/email/sendAdminPasswordResetNoticeEmail.ts` | `sendBrandedEmail` |
| `src/app/.../parents/actions.ts` | Invite via `sendBrandedEmail` |
| `src/lib/messaging/useCases/sendParentBulkCommunication.ts` | `sendWrappedHtmlEmail` |
| `src/lib/messaging/useCases/sendAdminSiteContactVisitorReplyEmail.ts` | `sendWrappedHtmlEmail` |

---

## Tasks

- [x] Spec approved
- [x] TDD: `sendWrappedHtmlEmail` + registry keys
- [x] Wire leaky senders
- [x] Changelog + verify grep
