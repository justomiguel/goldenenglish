# ADR: Admin user profile “ficha” with inline edit and password reset

## Context

Staff need a fast way to inspect and correct user data and login credentials from the admin user detail screen, with clear grouping (contact, guardians, academics) and guardrails (minors must have tutors, email never empty).

## Decision

1. Extend `loadAdminUserDetail` with `userId`, `is_minor`, `tutor_student_rel` summaries, and a `viewerMayInlineEdit` flag derived from the signed-in profile’s `role === 'admin'` so only true admins see edit affordances (aligned with `public.profiles`).
2. Persist changes through dedicated server actions (`adminUserDetailActions.ts`) using `createAdminClient` after `assertAdmin()`, updating both `profiles` and `auth.users` metadata/email where applicable; password changes use `auth.admin.updateUserById` with minimum length 8 and a confirmation modal on the client.
3. For minor students, guardian replacement deletes existing `tutor_student_rel` rows for that student and inserts the selected parent row; operations emit `recordSystemAudit` entries.

## Options considered

- **Full-page forms** — rejected: slower for support workflows and do not match the requested “ficha” inline pattern.
- **RPC-only updates** — rejected for this iteration: higher migration cost; PostgREST updates with the service-role client match existing admin patterns.

## Consequences

- Positive: Immediate corrections, auditable password and tutor changes, reusable validation in `adminUserDetailUpdateParse.ts`.
- Risks: Role changes are powerful; mitigated by admin-only session and audit. Client-side generated passwords use Web Crypto (`generateAdminPortalPassword`) and are only persisted after explicit admin confirmation.

## Follow-ups

- Vitest covers parsing and primary server-action branches; extend with integration tests if Supabase auth mocking becomes shared harness.
