## ADR: Login by DNI / passport (single identifier input)

## Context

Many enrolled students do not have a real email address (minors, families that share a single address, students enrolled via CSV import that only carries a national document number). The platform already creates them as Supabase Auth users using a deterministic synthetic email derived from the DNI: `{dni}@students.goldenenglish.local` for students (`src/lib/import/studentImportUtils.ts`) and `{dni}@parents.goldenenglish.local` for tutors (`src/lib/import/parentDefaultEmail.ts`). The schema has supported this since day one — `profiles.dni_or_passport TEXT NOT NULL` with a `UNIQUE INDEX` on `lower(trim(dni_or_passport))` (`supabase/migrations/masterdb.sql`).

What was missing was the user-facing path: those users were technically able to log in, but only if they typed (and remembered) the synthetic email. In practice support tickets routed through staff for every login. The product requirement is that a student or tutor should be able to log in with **either** their email (when they have one) **or** their DNI / passport, using the same form.

`AGENTS.md` pins Supabase Auth as the single identity provider — no parallel JWT or custom auth stack. The trust-boundary rule (`17-trust-boundary-handlers.mdc`) pins the OWASP A07 anti-pattern of any endpoint that can be used to enumerate users by document number.

## Decision

Implement a single shared login form ("Email or document"), with a thin server-side resolver that turns the typed identifier into the email Supabase Auth expects, then call `supabase.auth.signInWithPassword` exactly as before. Concretely:

1. **Pure parser** ([src/lib/auth/parseLoginIdentifier.ts](../../src/lib/auth/parseLoginIdentifier.ts)) — `parseLoginIdentifier(raw)` returns `{ kind: "email", value }` for full email shapes (RFC 5322-friendly check matching `requestPasswordReset.ts`) and `{ kind: "dni", value }` otherwise (with dot/whitespace normalization mirroring `normalizeDni`). No imports from Supabase or React.
2. **Adapter** ([src/lib/auth/lookupEmailByDni.ts](../../src/lib/auth/lookupEmailByDni.ts)) — given an admin `SupabaseClient`, looks up `profiles` by `dni_or_passport`, then reads the matching `auth.users.email` via `auth.admin.getUserById`. **Opacity is the contract**: when the DNI matches no profile (or any read fails) the function returns the deterministic synthetic address derived from the DNI itself, so callers cannot distinguish "exists" vs "does not exist" via the response shape **or** timing.
3. **Rate limit** ([src/lib/auth/loginIdentifierRateLimit.ts](../../src/lib/auth/loginIdentifierRateLimit.ts)) — separate in-memory bucket from `passwordResetRateLimit` (10 attempts / 15 min per `(ip, identifier)`). Different feature, different counters; sharing buckets would let one slow brute-force lock out the other path.
4. **Route handler** ([src/app/api/auth/resolve-login-id/route.ts](../../src/app/api/auth/resolve-login-id/route.ts)) — `POST { identifier } -> { email }`, validated with Zod, gated by the rate limit, always opaque (200 with a synthetic email when nothing matches), `Cache-Control: private, no-store, max-age=0` so CDNs / proxies cannot serve one client's resolved address to another (regla 17). Uses `createAdminClient` only inside this handler — never instantiated in components or hooks (regla `12`).
5. **Hook** ([src/hooks/useLogin.ts](../../src/hooks/useLogin.ts)) — renamed `email`/`setEmail` to `identifier`/`setIdentifier`. Flow: parse → if email, skip the resolver (no extra latency for the common path); if DNI, call the resolver then sign in with the returned email. All failures collapse to the existing generic "invalid credentials" message — opacity at the UI layer too. Trace-logging fingerprints renamed to `identifierFingerprint` (length + kind + domain when applicable) so the raw identifier never reaches console output.
6. **Form** ([src/components/organisms/LoginForm.tsx](../../src/components/organisms/LoginForm.tsx)) — single `FormField` with `type="text"`, `autoComplete="username"`, `inputMode="email"`, `spellCheck=false`, `autoCapitalize="none"`. Copy from `dict.login.identifierLabel/Placeholder/Hint`. The PWA / mobile shell ([src/components/pwa/organisms/LoginScreenNarrow.tsx](../../src/components/pwa/organisms/LoginScreenNarrow.tsx)) reuses the same form, so Tier A (regla `05`) is covered without forking.
7. **Analytics** — new entity `auth:login` in `AnalyticsEntity` ([src/lib/analytics/eventConstants.ts](../../src/lib/analytics/eventConstants.ts)). The hook emits `trackEvent("action", "auth:login", { method: "email" | "dni", success, stage? })` on every terminal outcome (success or any failure stage). Lets us monitor adoption of the DNI path and detect brute-force patterns (regla `08`).

## Options considered

- **Custom DNI auth (parallel JWT / cookie stack)** — rejected: violates `AGENTS.md` ("Supabase Auth only — no parallel custom JWT/login stacks") and would duplicate cookie / RLS / proxy plumbing.
- **Two separate fields or tabs (Email / Document)** — rejected: more code, more design, more i18n, and friction for the (still common) email user. A single input with a hint is the standard pattern in regional banking apps that also accept document numbers.
- **Replace `auth.users.email` with a synthetic `{dni}@no-email.local` for everyone** — rejected: loses the ability to send transactional email (receipts, reminders) to users who do have an email, and complicates the future "link your real email" story.
- **Resolve DNI client-side using a public RPC** — rejected: a public oracle that maps DNI to user existence is exactly the OWASP A07 vector this ADR is designed to avoid.
- **Return 404 from the resolver when the DNI is unknown** — rejected: same enumeration vector. The opaque-200 response (always returning a synthetic when nothing matches) is the documented mitigation.

## Consequences

**Positive**

- Students and tutors without an email can log in with the document number they already memorized for enrollment, without staff intervention.
- The cookie / session / RLS / middleware / proxy layers are unchanged: `signInWithPassword` still receives an email.
- Existing email users see a single new input label and an optional hint; the happy path costs zero extra network round-trips.
- The resolver is opaque by construction (timing and shape) and rate-limited; any monitoring on `[ge:server] api/auth/resolve-login-id:*` plus the `auth:login` analytics event covers detection.
- The single `LoginForm` change covers both desktop and PWA Tier A surfaces simultaneously.

**Risks / follow-ups**

- **Rate limit is per-process** (`Map` in memory). On Vercel each warm function keeps its own bucket. Acceptable as a first iteration; the same trade-off as `passwordResetRateLimit`. Follow-up when a shared store (Upstash / Postgres) exists for the wider auth surface.
- **Recovery for users with synthetic emails** is out of scope of this ADR (Plan 3): they cannot use `forgot-password` because no inbox receives the link. Today the only path is staff-driven password reset (admin opens the user, generates a temporary password). Follow-up: a dedicated server action behind `re-auth + audit + notification` (regla `17`) for staff to issue a temporary password, plus a "force change on first login" flag.
- **DNI collision into a real email**: if by random chance the synthetic address derived from a typed DNI happens to exist in `auth.users` as a real account (`12345678@students.goldenenglish.local`), `signInWithPassword` would still fail with `invalid_credentials` because the typed password would not match. No information leak.
- **Trace logs**: `[goldenenglish:login]` traces only run with `NEXT_PUBLIC_DEBUG_LOGIN=true` or in development. The fingerprint never includes the raw identifier. Anyone who turns on those traces in production should be aware that the domain part of an email is logged (matches the previous behavior).

## Related

- Pure parser: [src/lib/auth/parseLoginIdentifier.ts](../../src/lib/auth/parseLoginIdentifier.ts)
- Lookup adapter: [src/lib/auth/lookupEmailByDni.ts](../../src/lib/auth/lookupEmailByDni.ts)
- Rate limit: [src/lib/auth/loginIdentifierRateLimit.ts](../../src/lib/auth/loginIdentifierRateLimit.ts)
- Route handler: [src/app/api/auth/resolve-login-id/route.ts](../../src/app/api/auth/resolve-login-id/route.ts)
- Hook: [src/hooks/useLogin.ts](../../src/hooks/useLogin.ts)
- Form: [src/components/organisms/LoginForm.tsx](../../src/components/organisms/LoginForm.tsx)
- Analytics entity: `authLogin` in [src/lib/analytics/eventConstants.ts](../../src/lib/analytics/eventConstants.ts)
- Dictionaries: `login.identifier*` and `login.errors.identifierRequired` in [src/dictionaries/en.json](../../src/dictionaries/en.json) + [src/dictionaries/es.json](../../src/dictionaries/es.json)
- Related ADR: [2026-04-forgot-password-resend.md](./2026-04-forgot-password-resend.md) (recovery flow and rate limit pattern)
