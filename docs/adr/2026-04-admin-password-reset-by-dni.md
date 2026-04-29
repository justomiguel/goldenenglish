# ADR: Admin "Reset by DNI" + force password change on first login

## Context

Plan A (see [2026-04-login-by-dni.md](./2026-04-login-by-dni.md)) made it
possible for students and tutors without a real email address to log in using
their DNI / passport. That left an open hole: those same users **cannot**
self-recover. The standard `/{locale}/forgot-password` flow sends a recovery
link to whatever address Supabase Auth has on file, and for synthetic
mailboxes (`{dni}@students.goldenenglish.local`,
`{dni}@parents.goldenenglish.local`) that mail bounces.

Operationally, staff used to fix this by typing a free-form password into the
existing **"Set password"** card on the admin user detail page
(`setAdminUserPasswordFromDetailAction`). That action does not require step-up
re-auth and does not force the recipient to change the password afterwards,
so a compromised admin session could silently take over student accounts and
leave them with a known credential.

We need a hardened, one-click flow that:

1. Lets staff regenerate the original "DNI-derived" password for a student
   (the same value the CSV import seeds with).
2. Forces the student to choose a new password the next time they sign in,
   so the staff-known value is short-lived.
3. Leaves a clear audit trail and notifies the account holder when an email
   exists, both as a security control and as user-facing reassurance.

## Decision

Implement a dedicated server action **`resetUserPasswordByDniAction`** with
the following contract, plus a paired self-mutation
**`clearMustChangePasswordFlagAction`** and a middleware guard
**`mustRedirectToResetPassword`**.

### 1. Pure planner

[src/lib/auth/buildResetByDniPlan.ts](../../src/lib/auth/buildResetByDniPlan.ts) — given
`{ dni, currentEmail }`, returns
`{ generatedPassword, hasRealEmail }`. Reuses
[`normalizeDni`](../../src/lib/import/studentImportUtils.ts) (the same logic
that derives the bootstrap password during CSV import: DNI without dots /
spaces, padded to 6) and treats `@students.goldenenglish.local` and
`@parents.goldenenglish.local` as synthetic. No Supabase / no React.

### 2. Server action (admin)

[src/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions.ts](../../src/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions.ts)
exports `resetUserPasswordByDniAction(input)`. Trust boundary checklist
(rule 17):

- **Step-up re-auth**: requires the admin to re-enter their own password and
  validates it via [`verifyUserPassword`](../../src/lib/supabase/verifyUserPassword.ts),
  same primitive used by the parent → ward email change flow.
- **Audit**: persists to `system_config_audit` via
  [`recordSystemAudit`](../../src/lib/analytics/server/recordSystemAudit.ts)
  with `action: "admin.user.password_reset_by_dni"` and a payload that
  includes only `actorId`, `hasRealEmail`, `dniPresent`,
  `mustChangeFlagSet` — **the generated password is never logged or
  audited** (negative test guards this in
  [resetUserPasswordByDniAction.test.ts](../../src/__tests__/app/resetUserPasswordByDniAction.test.ts)).
- **Notification**: best-effort branded email to the account holder
  ([sendAdminPasswordResetNoticeEmail](../../src/lib/email/sendAdminPasswordResetNoticeEmail.ts)),
  but only when `hasRealEmail === true`. Synthetic mailboxes are skipped to
  avoid guaranteed bounces.
- **Must-change flag**: sets
  `auth.users.app_metadata.must_change_password = true` (merging existing
  keys to preserve `provider`, etc.) so the proxy / middleware redirects the
  next session to `/{locale}/reset-password`.

The action returns `{ ok: true, password, hasRealEmail }` on success so the
admin UI can reveal the password once and copy it (we never store it
anywhere).

### 3. Self-mutation that clears the flag

[src/app/[locale]/reset-password/clearMustChangePasswordAction.ts](../../src/app/[locale]/reset-password/clearMustChangePasswordAction.ts)
flips the same `app_metadata.must_change_password` to `false` for the current
user after a successful `updateUser({ password })`. Must be a server action
backed by the admin client because `app_metadata` is **only writable by the
service role**: a malicious user calling
`supabase.auth.updateUser({ data: ... })` from the browser only touches
`user_metadata`, which we do not consult for the guard.

### 4. Middleware guard

[src/lib/supabase/mustRedirectToResetPassword.ts](../../src/lib/supabase/mustRedirectToResetPassword.ts) is a
pure helper that decides redirect-or-not based on `(user, pathname)`, with
allowlist for `/{locale}/reset-password`,
`/{locale}/forgot-password`, `/{locale}/login`, `/{locale}/register`,
`/api/auth/*`, `/api/analytics/*`. Wired into
[updateSession](../../src/lib/supabase/middleware.ts) so the very next
request after the user re-logs sees the flag in the JWT and is redirected
without a DB round-trip.

### 5. UI

[AdminUserDetailDniResetSection](../../src/components/molecules/AdminUserDetailDniResetSection.tsx) —
new molecule rendered inside `AdminUserSecurityPanel` when
`role === "student" && dniOrPassport` exist. Two stacked modals:

- **Confirmation** with the admin's password input (`autoComplete="current-password"`).
- **Reveal** with the new password (read-only `Input`, font-mono), a copy
  button, an explicit warning that the value is not retrievable, and a
  contextual notice telling the admin whether the security email was sent.

[ResetPasswordForm](../../src/components/organisms/ResetPasswordForm.tsx) gains a
`mustChangeBanner` block (driven by the new `useResetPassword` field) so the
user understands why they were redirected.

### 6. Analytics

`auth:password_change_required_cleared` user event fired client-side after
the flag is cleared (the broader audit lives in `system_config_audit`).
`auth:password_reset_completed` (already in place) keeps covering the generic
case.

## Options considered

- **Re-use / harden the existing
  `setAdminUserPasswordFromDetailAction`** — rejected for this PR. That
  endpoint serves a different intent (free-form password chosen by the
  admin) and harder to lock without changing UX. Filed as follow-up:
  add step-up re-auth + must-change opt-in to that action too.
- **Persist `must_change_password` as a `profiles` column with RLS** —
  rejected: adds a migration, an RLS rule, and an extra DB query in the
  middleware on every authenticated request, while `app_metadata` is
  already in the JWT and only writable by the service role.
- **Store the temporary password and email it to the student** — rejected:
  the whole point of this flow is the student has no real email. Storing
  it would be its own breach surface (rule 4 / rule 17).
- **Explicit `signOut(target, "global")` after the reset** — rejected
  because Supabase Auth already invalidates refresh tokens when the
  password changes, so the next refresh kicks the user out anyway, and
  there is no SDK-supported "sign out by user id" without a JWT. The
  trade-off is documented: the existing access token (default 1h TTL) can
  keep working until expiration, which is acceptable for this surface.
- **Distinguish synthetic mailboxes in the
  `/forgot-password` copy** — rejected: would re-introduce the
  enumeration vector that Plan A explicitly closed in the resolver.

## Consequences

**Positive**

- Students and tutors without an email can recover through staff in under
  a minute, with the same DNI value they already memorize from enrollment.
- The temporary password is short-lived: the must-change guard forces a
  new value before the dashboard becomes usable.
- Audit trail and (when possible) email notice make the action observable
  by both staff and the account holder.
- Existing `setAdminUserPasswordFromDetailAction` is left untouched for
  staff workflows that need a free-form password.

**Risks / follow-ups**

- **Rate limit**: the new server action does not yet have its own throttle
  (relies on `assertAdmin` and on the step-up re-auth being validated by
  Supabase, which itself rate-limits sign-in attempts). Follow-up when a
  shared store is available — same plan as Plan A's resolver.
- **App_metadata propagation**: the flag becomes visible to the
  middleware after the user re-authenticates, which is exactly what we
  want. If the user's existing session keeps the access token alive for
  its TTL, they may experience one cached request before the redirect
  kicks in — acceptable.
- **`setAdminUserPasswordFromDetailAction`** still lacks step-up re-auth
  and the must-change flag. Tracking as a separate hardening PR.
- **No SMS recovery channel** — out of scope. If the project adopts an
  SMS provider, a parallel `recoverPasswordBySmsAction` would mirror this
  same trust-boundary contract.

## Related

- Pure planner: [src/lib/auth/buildResetByDniPlan.ts](../../src/lib/auth/buildResetByDniPlan.ts)
- Email notice: [src/lib/email/sendAdminPasswordResetNoticeEmail.ts](../../src/lib/email/sendAdminPasswordResetNoticeEmail.ts)
- Server action (admin): [src/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions.ts](../../src/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions.ts)
- Server action (self): [src/app/[locale]/reset-password/clearMustChangePasswordAction.ts](../../src/app/[locale]/reset-password/clearMustChangePasswordAction.ts)
- Middleware guard: [src/lib/supabase/mustRedirectToResetPassword.ts](../../src/lib/supabase/mustRedirectToResetPassword.ts) + wired in [src/lib/supabase/middleware.ts](../../src/lib/supabase/middleware.ts)
- Hook: [src/hooks/useResetPassword.ts](../../src/hooks/useResetPassword.ts)
- UI: [src/components/molecules/AdminUserDetailDniResetSection.tsx](../../src/components/molecules/AdminUserDetailDniResetSection.tsx) + [src/components/organisms/ResetPasswordForm.tsx](../../src/components/organisms/ResetPasswordForm.tsx)
- Analytics entity: `passwordChangeRequiredCleared` in [src/lib/analytics/eventConstants.ts](../../src/lib/analytics/eventConstants.ts)
- Dictionaries: `admin.users.detailDniReset*`, `resetPassword.mustChangeBanner*`, `emailAdminPasswordResetNotice.*` in [src/dictionaries/en.json](../../src/dictionaries/en.json) + [src/dictionaries/es.json](../../src/dictionaries/es.json)
- Related ADR: [2026-04-login-by-dni.md](./2026-04-login-by-dni.md) (Plan A)
- Related ADR: [2026-04-parent-ward-email-change-hardening.md](./2026-04-parent-ward-email-change-hardening.md) (same trust boundary contract for `parent → ward`)
