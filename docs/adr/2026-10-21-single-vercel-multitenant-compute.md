# Single Vercel project, one Supabase project per institute

## Context

The repo deploys once per institute (`scripts/vercel-targets.json`). Each Vercel project has its own Supabase env. Brand overlay already exists (`docs/adr/2026-04-multi-site-brand-overlay.md`). A shared database was out of scope there. Operators now want one build and one cron schedule, with data still isolated per institute.

## Decision

Resolve the institute from the `Host` header at runtime. `TENANTS_CONFIG_JSON` maps hosts to that institute's Supabase keys, brand slug, mail domain, Resend API key, WhatsApp/VAPID/Maps keys, and public origin. Leave Postgres schemas unchanged. When the variable is unset, keep today's env-based single tenant.

## Options considered

- **Keep N Vercel projects.** Rejected for this change. It is the current model. Every release builds N times.
- **One database and `tenant_id` on every table.** Rejected. It rewrites RLS, Auth, and `service_role` call sites. Data isolation is weaker.

## Consequences

- Positive: one production build. A new domain is config, not a new Vercel project.
- Risk: a missing `.eq` is not the bug. The bug is selecting the wrong Supabase project. Unknown hosts must 404. Cron must loop tenants inside `AsyncLocalStorage`, not trust `Host` (cron hits one deployment domain).
- Risk: `NEXT_PUBLIC_*` is fixed at build. The browser gets the anon key from the root layout, not from `process.env`.
- Follow-up: move domains onto one Vercel project after the JSON is in place. Do not point webhooks at a host that is not in `hosts`.
- While `TENANTS_CONFIG_JSON` is set, missing tenant resolution fails closed. Code does not read the single-tenant Supabase, Resend, KV, or payment-key env vars. `SKIP_INITIAL_SITE_SETUP` does not close every institute. The client bundle does not contain one institute's Supabase URL or anon key.
