# ADR: Tenant-aware parent/tutor synthetic Auth emails

**Date:** 2026-07-24  
**Status:** Accepted  
**Related:** `docs/adr/2026-04-login-by-dni.md`, `docs/superpowers/specs/2026-07-24-tenant-parent-synthetic-email-design.md`

## Context

Minor **students** without email use `MAIL_TENANT` (`composeSyntheticMinorStudentEmail`). Parent/tutor provisioning without email still used a hardcoded `{dni}@parents.goldenenglish.local` from the original single-tenant design (`parentDefaultEmail`). On non-Golden tenants that produced wrong Auth identities.

## Decision

1. New parent synthetics: `{dni}@parents.<MAIL_TENANT>` via `parentSyntheticMailDomain()` / `parentDefaultEmail()`.
2. If `MAIL_TENANT` is missing and a synthetic is required, `ensureParentProfileByTutorDni` returns `tutor_mail_tenant_missing` (fail closed; same posture as minor create).
3. Login opacity (`lookupEmailByDni`) may fall back to the legacy Golden parent domain when `MAIL_TENANT` is unset so the resolver never returns null.
4. Password-reset / bounce skip treats any `@parents.<domain>` (plus legacy Golden student/parent suffixes) as non-deliverable (`isParentSyntheticEmail`).

## Options considered

- Same mailbox domain as students (`tutor-{dni}@MAIL_TENANT`) — rejected; keeps student/parent Auth spaces distinct.
- Separate `MAIL_TENANT_PARENTS` env — rejected; more ops cost for little gain.

## Consequences

- Each tenant must set `MAIL_TENANT` before creating guardians without email.
- Existing Auth users already created as `@parents.goldenenglish.local` on other tenants are **not** auto-migrated (ops follow-up if needed).
- Tests lock domain construction and ensure-parent fail-closed behavior.
