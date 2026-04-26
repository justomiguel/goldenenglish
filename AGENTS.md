# Agent / skills — Golden English

## Stack (source of truth)

- **Next.js** (App Router), **React**, **Tailwind**, **Vitest**.
- **Supabase** (Postgres + Auth). Identity: **Supabase Auth only** — no parallel custom JWT/login stacks.
- **Server actions** and route handlers under `src/app/**`: validate input (e.g. Zod), check session/roles on the server, never trust client-only checks.

Workspace rules in **`.cursor/rules/`** override generic skill examples when they conflict (design system, security, PWA surfaces, testing/coverage, **analytics / eventos**, **copy / i18n**).

## Structured logging (ops / Vercel)

Logs use a stable prefix so you can filter runtime output (local terminal, **Vercel → Logs**, log drains):

| Prefix | Where | Module | Typical use |
|--------|--------|--------|----------------|
| **`[ge:server]`** | Node (server actions, route handlers, `src/lib/**` server code) | `src/lib/logging/serverActionLog.ts` | Supabase `.error` (`logSupabaseClientError`), thrown errors (`logServerException`), expected auth/session denials (`logServerAuthzDenied` → `console.warn`, `{ kind: "authz_denied" }`) |
| **`[ge:client]`** | Browser (hooks, analytics cliente, PWA) | `src/lib/logging/clientLog.ts` | Failures after `sendBeacon`/`fetch`, localStorage, SSE import jobs, etc. (`logClientException`, `logClientWarn`) |

**Do not** log secrets or PII in `meta`; use stable scopes (e.g. `reviewPayment:insert`) and ids when useful. The **`[ge:server]`** helpers are documented at the top of `serverActionLog.ts`.

| Regla siempre activa (`alwaysApply: true`) | Tema |
|----|-----|
| **`08-analytics-observability.mdc`** | Métricas: `user_events`, ingestión cliente/API, `recordSystemAudit`, sin features “silenciosas”; fiabilidad tipo SRE (SLI/SLO, alertas accionables) donde aplique. |
| **`09-i18n-copy.mdc`** | Copy visible: `src/dictionaries/en.json` + `es.json`, sin literales en UI; `Intl` para fechas/números; skill **`i18n-localization`**. |
| **`10-engineering-governance.mdc`** | ADR / mini diseño para auth, datos, integraciones y contratos públicos; enlaces con TDD, DDD y terceros. |
| **`11-long-running-jobs-ui.mdc`** | Jobs largos: `LongJobActivityModal` (log desde backend) + `LongJobLoader` + `useLongJobPoll` / SSE + `pollLongJob`. |
| **`12-supabase-app-boundaries.mdc`** | Supabase solo vía la app: fábricas de cliente en `src/lib/supabase/`; sin PostgREST/Postgres ad hoc para negocio; alineado con DDD y `03-architecture`. |
| **`13-postgrest-pagination-bounded-queries.mdc`** | PostgREST acotado: sin `select("*")` innecesario; listados que crecen = **paginación servidor** (`range` + `count` al mismo filtro o RPC). **No** “solo `.limit(N)`” sin total/navegación; **no** paginar solo en cliente si el servidor trae todo. Patrones: `loadPaginatedRegistrations`, `loadPaginatedAdminUsers`, `chunkedIn`, RPC hub. |
| **`17-trust-boundary-handlers.mdc`** | Bordes de confianza: secretos de cron solo por header (`verifyCronRequest`), `Cache-Control: private` en respuestas personalizadas, mutaciones cross-account con `createAdminClient` requieren re-auth + auditoría (`system_config_audit`) + notificación al titular, HTML editable persistido pasa por sanitizer del repo (`sanitizeMessageHtml`, `sanitizeEmailTemplateHtml`). Origen: auditoría OWASP de 2026-04. |
| **`16-admin-buttons-icons.mdc`** | `Button` y enlaces CTA: icono Lucide leading + a11y; al tocar un control sin icono, añadirlo si el alcance lo permite. |
| **`18-no-native-browser-dialogs.mdc`** | Sin `alert` / `confirm` / `prompt` en producto: `Modal` + DS, toasts/banners existentes, **11** para jobs largos; copy **09**. |

**Reglas con `globs` (aplican al tocar esas rutas):** otras bajo **`.cursor/rules/`** según `globs` / `alwaysApply` de cada archivo.

## Security skills vs this repo

| Skill | Use for |
|-------|--------|
| **`owasp-security`** | OWASP Top 10 (2021) web risks, reviews, XSS/CSRF/injection mindset. |
| **`api-security-best-practices`** | API hardening, OWASP API Top 10, rate limiting, validation patterns. |

**Important:** Both skills include illustrative **Express/JWT/bcrypt** snippets. In **this** project, treat those as patterns only: apply the **intent** (authorization checks, validation, least privilege, safe errors) using **Supabase session**, **RLS**, and **Next.js server boundaries** per **`.cursor/rules/04-security.mdc`**.

## Other skills (quick map)

- **Next / React / Vercel:** `next-best-practices`, `vercel-react-best-practices`, `frontend-dev-guidelines`, etc.
- **Data:** `supabase-postgres-best-practices`
- **Testing:** `tdd`, project rule **`.cursor/rules/02-testing-tdd.mdc`**
- **i18n, PWA, SEO, deploy:** matching skills under `.agents/skills/`

## When in doubt

1. Read the relevant **`.cursor/rules/*.mdc`** file.
2. Prefer **project conventions** over copy-pasting generic skill code.
3. Nuevas features con impacto en producto o admin: **`.cursor/rules/08-analytics-observability.mdc`** (eventos y auditoría).
4. Cualquier texto que vea el usuario: **`.cursor/rules/09-i18n-copy.mdc`** (diccionarios y convenciones del repo).
5. Auth, datos, integraciones o contratos públicos: **`.cursor/rules/10-engineering-governance.mdc`** (ADR / mini diseño).
6. Importaciones o batches largos con feedback en UI: **`.cursor/rules/11-long-running-jobs-ui.mdc`** (`LongJobStatus`, `pollLongJob`).
7. Acceso a Supabase (clientes, REST, service role): **`.cursor/rules/12-supabase-app-boundaries.mdc`**.
8. Consultas listadas / volumen PostgREST: **`.cursor/rules/13-postgrest-pagination-bounded-queries.mdc`**.
