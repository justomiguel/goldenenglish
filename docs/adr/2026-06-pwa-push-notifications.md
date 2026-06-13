# ADR: PWA with Web Push notifications

**Date:** 2026-06  
**Status:** Accepted

## Context

Golden English already exposed a Web App Manifest, PWA meta tags, and parent/student mobile shells, but the service worker was a no-op stub and push permission UI did not persist subscriptions or deliver server-side notifications. Product needs installable PWA behavior on Tier A surfaces (parents/students) plus push for messaging and urgent class reminders.

## Decisions

1. **Web Push with self-hosted VAPID** — Use the `web-push` library and VAPID keys in environment variables. No third-party push broker (OneSignal/FCM web) to keep data in Supabase and avoid extra vendor contracts.
2. **Serwist for the service worker** — `@serwist/next` generates `public/sw.js` at build time with precaching, runtime caching, offline document fallback (`/offline`), and custom `push` / `notificationclick` handlers.
3. **Subscriptions in Postgres** — Table `push_subscriptions` stores endpoint + encryption keys per user/device; RLS restricts rows to `auth.uid()`.
4. **Push complements email/WhatsApp** — `pushAfterNotify` runs after primary channels; failures are logged with `[ge:server]` and never block email or WhatsApp delivery.
5. **Category preferences deferred** — No per-category opt-out table in this phase; class urgent push follows existing in-app reminder prefs gate.

## Options considered

| Option | Rejected because |
|--------|------------------|
| OneSignal / Firebase | Extra vendor, duplicate subscription store, privacy review |
| Manual SW without Serwist | Reinvent precache/revision handling; Serwist is maintained for App Router |
| Push-only without install/offline | Incomplete PWA; plan requires caching + install prompt |

## Consequences

- **Env:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` required in each deployment target.
- **Build:** Serwist disabled in development to avoid stale SW during HMR; production builds emit `public/sw.js` (gitignored).
- **Privacy:** Payloads carry title/body/url only — no PII beyond what the user already sees in-app.
- **Follow-up:** Per-category push prefs, payment-due push from billing cron, localized class-reminder URLs from job payload locale.

## References

- `src/sw.ts`, `src/lib/push/*`, `supabase/migrations/151_push_subscriptions.sql`
- `.cursor/rules/05-pwa-mobile-native.mdc`, `17-trust-boundary-handlers.mdc`
