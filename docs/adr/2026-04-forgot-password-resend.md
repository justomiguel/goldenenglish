# ADR: Forgot password flow with Supabase admin link + Resend

## Context

Login lives at `/{locale}/login` and the form already shows a "Forgot your password?" link pointing to `/{locale}/forgot-password`, but neither the page nor the recovery flow existed. The product requirement is that **all** transactional emails leave the system through Resend (`EmailProvider` adapter), with copy in `src/dictionaries/{en,es}.json` and brand pulled from `system.properties` (rules `01`, `09`, `12`). Supabase Auth is the single identity provider (`AGENTS.md`).

## Decision

Implement a self-contained recovery flow:

1. **Request side (`/{locale}/forgot-password`)** — Server action `requestPasswordResetAction` validates the email, applies an in-memory rate limit (5 / 15 min per `(ip,email)`), and delegates to a pure-ish use case `requestPasswordReset` that:
   - Calls `supabase.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } })` from the admin client (only allowed in `src/lib/supabase/admin.ts`, per rule `12`). `generateLink` returns the action link **without** sending Supabase's built-in email.
   - Sends the link via `EmailProvider.sendEmail` (Resend in production) using a branded template under the new `emailPasswordReset.*` dictionary namespace.
   - **Always** returns `{ ok: true }` to the caller, even when the email is unknown or the email provider fails — leaking existence is OWASP A07/A04. Failures are logged with the standard `[ge:server]` prefix.
2. **Reset side (`/{locale}/reset-password`)** — Client hook `useResetPassword`:
   - Reads the recovery `code` from the URL (query string or hash) and calls `supabase.auth.exchangeCodeForSession(code)` to materialize cookies.
   - Validates the new password (≥ 8 chars, matches confirm).
   - Calls `supabase.auth.updateUser({ password })`.
   - Emits `trackEvent("action", "auth:password_reset_completed")` (new entity in `AnalyticsEntity`, no enum migration needed because we reuse the existing `action` event type per the convention used by other business events).
   - Navigates to `/{locale}/dashboard` so the document request carries the fresh session cookies.
3. **Surfaces** — Tier A (student / parent journey) demands both desktop and PWA / mobile-native trees (rule `05`). The pages reuse a new shared chrome (`AuthScreenDesktop` + `AuthScreenNarrow`) so login, forgot and reset stay visually aligned and the file budget per component stays under 250 lines (rule `03`). Pages export `robots: { index: false, follow: false }` (rule `06`).

## Options considered

- **Custom SMTP via Resend at the Supabase Auth level** — rejected: the Resend brand and templates would be controlled in the Supabase dashboard rather than in our dictionaries / `system.properties`, breaking the single-source-of-truth rule and requiring deploy coordination outside the repo.
- **Auth Hooks (Send Email Hook → webhook → Resend)** — rejected for now: same outcome but adds an extra deployable surface and obscures the contract; the `generateLink + Resend` path keeps everything inside the Next.js process and our test suite.
- **Skip rate limiting in the first iteration** — rejected: even a best-effort in-memory limit raises the bar against trivial abuse; the limitation (per-instance only on serverless) is documented below.
- **Add a new `password_reset_*` value to the `user_event_type` Postgres enum** — rejected: the existing convention is to keep four top-level event types and encode business specifics in `entity` (e.g. `payment_receipt_submitted_parent`). A migration would touch `010_analytics_observability.sql`, the API route schema, and downstream tests for no functional gain.

## Consequences

**Positive**

- Recovery emails carry the institute brand (`getBrandPublic()`) and the correct locale automatically.
- Supabase remains the single identity provider; no shadow user store.
- The use case is unit-testable with injected `adminClient` + `EmailProvider`, mirroring the messaging notification pattern.
- New `auth:password_reset_completed` analytics entity feeds the same `user_events` pipeline used for funnel and SLI work in rule `08`.

**Risks / follow-ups**

- **Rate limit is per-process** (`Map` in memory). On Vercel each warm function keeps its own bucket. Acceptable as a first iteration; follow-up: move to Upstash / Postgres if abuse appears or when the broader rate-limiting story lands (no shared store exists in the repo today).
- The recovery link uses Supabase's verify endpoint and lands on our `/{locale}/reset-password?code=...`. If the project later migrates to a different PKCE shape (e.g. hash-only), the hook already supports both `?code=` and `#code=`.
- Email delivery failures are logged but invisible to the user (by design — existence leak). Operations should watch `[ge:server] requestPasswordReset:sendEmail` in Vercel Logs and Resend bounces. A formal SLO can be added when the broader auth observability story is opened (rule `08`).

## Related

- Use case: `src/lib/auth/requestPasswordReset.ts`
- Email composer: `src/lib/auth/sendPasswordResetEmail.ts`
- Rate limit: `src/lib/auth/passwordResetRateLimit.ts`
- Server action: `src/app/[locale]/forgot-password/actions.ts`
- Pages: `src/app/[locale]/forgot-password/page.tsx`, `src/app/[locale]/reset-password/page.tsx`
- Hooks: `src/hooks/useRequestPasswordReset.ts`, `src/hooks/useResetPassword.ts`
- Shared auth chrome: `src/components/desktop/organisms/AuthScreenDesktop.tsx`, `src/components/pwa/organisms/AuthScreenNarrow.tsx`
- Analytics entity: `src/lib/analytics/eventConstants.ts` (`passwordResetCompleted`)
