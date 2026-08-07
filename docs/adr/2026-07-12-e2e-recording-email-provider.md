# ADR: Recording EmailProvider for isolated E2E

**Date:** 2026-07-12  
**Status:** Accepted  
**Spec:** `docs/superpowers/specs/2026-07-12-e2e-mock-email-provider-design.md`

## Context

Playwright E2E runs a real Next.js process (`GE_DEV_TARGET=e2e`). Transactional mail goes through the `EmailProvider` port (`getEmailProvider()` → historically always `ResendEmailProvider`). Missing `RESEND_*` returns `{ ok: false }` and can break flows; leaked tenant keys can send real Resend traffic.

## Decision

1. When `GE_DEV_TARGET=e2e` (or `EMAIL_PROVIDER=recording`), `getEmailProvider()` returns `RecordingEmailProvider`: in-memory append + `{ ok: true }`, no Resend SDK.
2. Precommit / Playwright webServer strip `RESEND_*` and force `EMAIL_PROVIDER=recording`.
3. Optional introspection: `GET|DELETE /api/e2e/recorded-emails` only in recording mode (`404` otherwise), `Cache-Control: private, no-store`.

## Alternatives considered

| Option | Rejected because |
|--------|------------------|
| Rely on missing API key | Flows see `ok: false`; keys can leak |
| Playwright browser route to Resend | Server-side sends bypass the browser |
| Always noop in non-prod | Tenant `dev:*` may intentionally send test mail |

## Consequences

- E2E never bills or delivers via Resend.
- Specs may assert via `/api/e2e/recorded-emails` when needed; most remain UI-only.
- Supabase Auth SMTP (native confirm emails) is out of scope — not this port.
