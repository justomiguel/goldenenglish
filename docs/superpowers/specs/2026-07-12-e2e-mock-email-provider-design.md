# E2E mock email provider (no real Resend)

**Date:** 2026-07-12  
**Status:** Approved  
**Related:** `docs/runbooks/e2e-isolated-harness.md`, `EmailProvider` port (`src/lib/email/emailProvider.ts`), ADR forgot-password / communications templates

## Understanding

- Playwright E2E runs a **real Next.js server** (`GE_DEV_TARGET=e2e`). Outbound mail goes through `getEmailProvider()` → `ResendEmailProvider`.
- Today `.env.local.e2e` usually omits `RESEND_*`, so sends fail with `RESEND_API_KEY missing` rather than delivering — but if keys leak into the e2e env (copy from tenant pull, shell export), **real Resend traffic** can happen.
- Product flows that treat `{ ok: false }` as a hard failure can flake; E2E should treat email as a **side effect that succeeds without network**.
- Unit tests already mock `getEmailProvider` / `sendEmail`. E2E must mock at the **runtime adapter** boundary, not via Vitest.

## Intent

On the isolated E2E stack, **never call Resend**. Use a recording/noop `EmailProvider` that returns `{ ok: true }` and records calls so tests can assert the service was invoked.

## Decision

1. **Add `RecordingEmailProvider`** (`src/lib/email/recordingEmailProvider.ts`) implementing `EmailProvider`:
   - Appends each `sendEmail` input to a process-local store (module singleton).
   - Returns `{ ok: true }` immediately — no `resend` SDK, no HTTP.
   - Expose pure helpers: `clearRecordedEmails()`, `getRecordedEmails()` for tests / introspection.

2. **Switch in `getEmailProvider()`** when E2E mock is active:
   - Active when **`GE_DEV_TARGET=e2e`** (same flag already required by the isolated harness), **or** explicit `EMAIL_PROVIDER=recording` for local debugging.
   - Otherwise keep `ResendEmailProvider` (prod / tenant `dev:*`).
   - Guard: if `GE_DEV_TARGET=e2e` and somehow `EMAIL_PROVIDER=resend` is forced, still prefer recording unless we document an explicit escape hatch — **default fail-closed: e2e always records**.

3. **Hardening the e2e env:**
   - `buildE2eLocalEnvFileContents` writes `EMAIL_PROVIDER=recording` and **does not** write `RESEND_API_KEY` / `RESEND_FROM_EMAIL`.
   - `run-e2e-precommit.mjs` **unsets** `RESEND_API_KEY` / `RESEND_FROM_EMAIL` in the child Next env (and sets `EMAIL_PROVIDER=recording`) so shell-exported tenant keys cannot leak into the e2e process.
   - Document in `docs/runbooks/e2e-isolated-harness.md` + `.env.example` note.

4. **Observability for “was the service called?”**
   - **Vitest (primary):** unit tests on `getEmailProvider` switching + `RecordingEmailProvider` append/clear behavior.
   - **Optional E2E introspection (same PR if cheap):** `GET /api/e2e/recorded-emails` (and `DELETE` to clear) enabled **only** when `GE_DEV_TARGET=e2e`, returns `{ emails: [...] }` with `Cache-Control: private, no-store`. Not registered in prod. Playwright helpers may call it when a flow asserts mail was attempted; most critical specs stay UI-only and rely on `{ ok: true }` not blocking the journey.
   - Do **not** require asserting Resend HTTP — that would be the wrong boundary.

5. **ADR mini** under `docs/adr/` — EmailProvider selection for e2e (auth/integration contract).

## Alternatives rejected

| Option | Why not |
|--------|---------|
| Leave missing `RESEND_API_KEY` as “mock” | Returns `ok: false`; can break flows; silent if keys leak |
| Playwright `page.route` to block Resend CDN | Server-side Resend bypasses browser; incomplete |
| Always noop in all non-prod | Tenant local `dev:nago` may intentionally send test mail; scope = e2e only |
| MSW in Next process | Heavier; port already exists |

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Recording store grows across long suite | Clear on process start; optional DELETE endpoint between specs that assert mail |
| Prod accidentally uses recording | Gate strictly on `GE_DEV_TARGET=e2e` / `EMAIL_PROVIDER=recording`; never set those in Vercel tenant projects |
| Introspection endpoint abuse | Only mount when e2e target; no secrets; local allowlist already for Playwright BASE_URL |

## Done when

- [x] `GE_DEV_TARGET=e2e` → `getEmailProvider()` is recording; no Resend SDK call.
- [x] Precommit e2e child env strips `RESEND_*` and sets `EMAIL_PROVIDER=recording`.
- [x] Vitest covers provider switch + recording behavior (self-contained).
- [x] Runbook + `.env.example` document the contract.
- [x] Mini ADR linked from this spec.
- [ ] Manual QA (user): optional — run one mail-triggering critical flow and confirm no Resend dashboard delivery.

## Out of scope

- Changing product email templates / Resend production config.
- Capturing Supabase Auth built-in emails (confirm signup) — those are Auth SMTP, not `EmailProvider`.
- Asserting every critical E2E spec against recorded mail (only wire the mechanism; specs opt in later).
- Real mailbox (Mailpit / Inbucket) — not required if recording provider is enough.

## Definition of done (agent)

Automated: Vitest green for new modules; e2e env builder/precommit script updated.  
Manual QA (user): confirm no real Resend send when running isolated e2e after a password-reset or registration notification path if those fire mail.
