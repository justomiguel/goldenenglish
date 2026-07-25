# Tenant-aware synthetic parent/tutor email

**Date:** 2026-07-24  
**Status:** Approved  
**Type:** Bug fix (multi-tenant / Auth provisioning)

## Understanding

- Creating a **new guardian** while creating a minor (empty tutor email) calls `ensureParentProfileByTutorDni` → `parentDefaultEmail(dni)`.
- That helper returns `{dni}@parents.goldenenglish.local` — hardcoded from the original single-tenant Golden English design (see ADR `2026-04-login-by-dni`).
- Minor **students** already use per-tenant `MAIL_TENANT` (`getRegistrationMailTenantDomain` / `composeSyntheticMinorStudentEmail`). Parents/tutors were never migrated.
- Same bug hits CSV import / any path that omits tutor email.

## Root cause

| Path | Synthetic domain |
|---|---|
| Minor student (register / admin create) | `@MAIL_TENANT` ✅ |
| Parent/tutor without email | `@parents.goldenenglish.local` ❌ always |

Not a UI bug: domain comes from `src/lib/import/parentDefaultEmail.ts`.

## Decision (proposed)

1. Change `parentDefaultEmail` to build  
   `{safeDni}@parents.<MAIL_TENANT>`  
   when `getRegistrationMailTenantDomain()` is set (strip leading `@`; reuse same env as students).
2. If `MAIL_TENANT` is missing: fail closed for **admin create / ensure parent** paths that need a synthetic address (same posture as minor student create), **or** keep a documented classic fallback only when product requires Golden local — prefer fail-closed + clear error for multi-tenant targets.
3. Update synthetic detection in `buildResetByDniPlan` / password-reset skip lists so any `@parents.<tenant>` (and legacy `@parents.goldenenglish.local`) counts as non-deliverable.
4. Tests + short ADR note linking to login-by-DNI ADR consequences.
5. `.env.example` documents that parent synthetics use `parents.` + `MAIL_TENANT`.

### Options considered

| Option | Verdict |
|---|---|
| A. Same domain as students: `tutor-{dni}@MAIL_TENANT` | OK but loses clear student/parent mailbox split |
| B. `parents.` + `MAIL_TENANT` subdomain | **Chosen** — closest to current `parents.goldenenglish.local` shape |
| C. New `MAIL_TENANT_PARENTS` env | Extra ops burden; reject unless institutes need independent domains |

## Intent

Synthetic guardian Auth emails must follow the **current tenant’s** `MAIL_TENANT`, not Golden English hardcoded branding.

## Done when

- [x] Empty tutor email on create-minor / import → `@parents.<MAIL_TENANT>` (or explicit fail if unset).
- [x] Legacy `@parents.goldenenglish.local` still treated as synthetic for reset/notice skip.
- [x] Vitest covers domain construction + ensure-parent wiring; reuses `mailTenantMissing` copy.
- [x] ADR `docs/adr/2026-07-24-tenant-parent-synthetic-email.md`.

## Out of scope

- Migrating existing Auth users already created with `@parents.goldenenglish.local` on non-Golden tenants (optional ops follow-up / script).
- Changing real tutor emails when the admin fills the email field.

## Definition of done

Automated tests green; Manual QA (user): on a non-Golden tenant with `MAIL_TENANT` set, create minor + new guardian without email → Auth email domain matches tenant.
