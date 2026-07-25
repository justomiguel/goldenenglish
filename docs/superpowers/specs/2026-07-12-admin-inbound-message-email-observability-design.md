# Admin inbound message email — confirm + harden observability

**Date:** 2026-07-12  
**Status:** Approved — implementing  
**Related:** `.cursor/rules/08-analytics-observability.mdc`, `.cursor/rules/25-server-error-logging.mdc`, `src/lib/messaging/notifyMessagingEmails.ts`

## Intent

Confirm that inbound messages to administration (public contact form, parent→admin, student→admin) already email every `role=admin` profile, and harden the shared notifier so silent mail failures become visible in **server logs** and **`audit_events`** (communications domain) without changing the user-facing success contract when the inbox row was persisted.

## Context (current behavior)

| Channel | Persist | Email today |
|---------|---------|-------------|
| Public contact | `deliverPublicSiteContactToAdmins` → one `portal_messages` row per admin | Calls `notifyPortalRecipientForStaffMessage` |
| Parent → administration | `sendParentMessageToAdministrationUseCase` | Same |
| Student → administration | `sendStudentMessageToAdministrationUseCase` | Same |

`notifyPortalRecipientForStaffMessage`:

- Resolves Auth email via `admin.auth.admin.getUserById`.
- **Silent no-op** when there is no email (`if (!to) return`).
- Calls `sendBrandedEmail` with template `messaging.staff_portal_new` but **ignores** `{ ok: false }`.
- Callers only `catch` thrown exceptions; soft failures are invisible.

`recordSystemAudit` requires an admin session (`assertAdmin`) — unsuitable for public/parent/student paths. Use **`auditCommunicationsAction` → `recordAuditEvent`** (service-role insert into `audit_events`) instead.

## Decision

**Approach 1 — harden the shared helper** `notifyPortalRecipientForStaffMessage` (and keep the same success/failure contract for callers):

1. After resolving Auth email: if missing → `logServerWarn` with stable `scope` + `reason: "no_email"` + `recipientId` (no email address / PII dump).
2. After `sendBrandedEmail`: if `{ ok: false }` → `logServerWarn` (or exception helper if thrown) with `reason: "send_failed"` + stable error code from provider (no HTML body).
3. On either failure path → `void auditCommunicationsAction({...})` with:
   - `action`: `notify_failed` (or equivalent stable string)
   - `resourceType`: `portal_message_notify`
   - `resourceId`: `recipientId`
   - `summary`: short non-PII summary
   - `metadata`: `{ reason: "no_email" | "send_failed", recipientRole, errorCode? }` — sanitized via existing audit sanitizer
4. Optional `source?: string` on the notify params (e.g. `contact_form` | `parent_admin` | `student_admin` | `staff`) when callers already know it — include in metadata when provided; do not require migrations.
5. **Do not** fail the messaging use case when notify fails after a successful insert (existing try/catch stays).
6. **Do not** change template copy, Resend config, or add new email product features in this change.

Callers (contact / parent / student) may pass `source` in the same PR for clearer audits; not mandatory for DoD if the helper alone logs + audits.

## Out of scope

- New email templates or subject redesign.
- Blocking form submit / portal send when mail fails.
- Retry queues / digests / BCC aggregation.
- Push notifications for admins.
- Changing who counts as “admin” (still `profiles.role = 'admin'`).
- UI surfacing of notify failures in admin dashboard (ops use logs + `audit_events` for now).

## Done when

- [x] Spec approved; Gate 0 marker written.
- [x] `notifyPortalRecipientForStaffMessage` logs and audits `no_email` and `send_failed` paths.
- [x] Existing inbound channels still call this helper (no regression of “email all admins”).
- [x] Vitest coverage in `src/__tests__/lib/messaging/notifyMessagingEmails.test.ts` (self-contained): asserts warn/audit on both failure modes; success path still sends branded email.
- [x] No user-visible dictionary changes required unless we add copy (we should not).

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Audit insert fails | Already non-blocking (`void` / ignore `ok`); primary signal remains `[ge:server]` logs |
| Extra audit volume | One row per failed recipient only; success stays quiet |
| PII in audit | Metadata: ids + reason codes only; sanitizer already strips sensitive keys |

## Manual QA (user)

- Submit public contact with Resend configured → each admin Auth email receives `messaging.staff_portal_new`.
- Confirm Vercel/local logs show nothing noisy on success; on a test admin without Auth email, see warn + `audit_events` row.

## Definition of done (Gate 0)

Observability hardened at the shared notifier; inbound admin email behavior confirmed unchanged for the happy path; tests lock failure observability.
