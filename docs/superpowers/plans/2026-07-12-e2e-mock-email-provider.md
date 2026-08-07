# Plan: E2E mock email provider

**Spec:** `docs/superpowers/specs/2026-07-12-e2e-mock-email-provider-design.md`  
**Date:** 2026-07-12

## Tasks

1. **TDD — RecordingEmailProvider** — store + clear + ok:true without Resend.
2. **TDD — getEmailProvider switch** — e2e / EMAIL_PROVIDER=recording → recording; else Resend.
3. **Env builder + precommit** — write EMAIL_PROVIDER=recording; unset RESEND_* in child env.
4. **Optional API** — GET/DELETE `/api/e2e/recorded-emails` only when GE_DEV_TARGET=e2e.
5. **Docs** — runbook, `.env.example`, mini ADR.
6. **Vitest** green for touched modules.
