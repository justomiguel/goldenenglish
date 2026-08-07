# Admin inbound message email observability — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task with TDD. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden `notifyPortalRecipientForStaffMessage` so missing Auth email and `sendBrandedEmail` failures emit `[ge:server]` warns and `audit_events` (communications) without changing the happy-path email or inbox success contract.

**Architecture:** Single shared helper already used by contact form, parent→admin, and student→admin. Check `sendBrandedEmail` result; on `no_email` / `send_failed` call `logServerWarn` + `void auditCommunicationsAction`. Optional `source` metadata from callers.

**Tech Stack:** Vitest, `logServerWarn`, `auditCommunicationsAction` / `recordAuditEvent`, existing Resend/`sendBrandedEmail` path.

## Global Constraints

- Do not block messaging success when notify fails after persist.
- No PII in logs/audit metadata (ids + reason codes only).
- No new email templates or dictionary copy.
- Self-contained tests per `30-harness-self-contained-tests.mdc`.

---

## File map

| File | Change |
|------|--------|
| `src/lib/messaging/notifyMessagingEmails.ts` | Observability on failure; optional `source` |
| `src/__tests__/lib/messaging/notifyMessagingEmails.test.ts` | Assert warn + audit for `no_email` and `send_failed` |
| `src/lib/messaging/deliverPublicSiteContactToAdmins.ts` | Pass `source: "contact_form"` |
| `src/lib/messaging/useCases/sendParentMessageToAdministration.ts` | Pass `source: "parent_admin"` |
| `src/lib/messaging/useCases/sendStudentMessageToAdministration.ts` | Pass `source: "student_admin"` |

---

### Task 1: Failing tests for observability

- [ ] Mock `logServerWarn` and `auditCommunicationsAction` in `notifyMessagingEmails.test.ts`
- [ ] Extend no-email case: expect warn with `reason: "no_email"` and audit `notify_failed`
- [ ] Add case: `sendEmail` returns `{ ok: false }` → warn `send_failed` + audit
- [ ] Run test — expect RED

### Task 2: Implement helper hardening

- [ ] Update `notifyPortalRecipientForStaffMessage` per spec
- [ ] Run targeted vitest — expect GREEN

### Task 3: Pass `source` from inbound callers

- [ ] Wire optional `source` on the three inbound paths
- [ ] Quick regression: existing use-case tests still pass

### Task 4: Verify

- [ ] `npx vitest run src/__tests__/lib/messaging/notifyMessagingEmails.test.ts`
- [ ] Mark spec Done-when checkboxes mentally complete
