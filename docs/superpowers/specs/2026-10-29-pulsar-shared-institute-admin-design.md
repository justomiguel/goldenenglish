# Pulsar admin — shared institute database

## Intent

Staff create an institute in `/[locale]/admin` and choose either its own Supabase project or Pulsar's database. A shared institute gets Postgres schema `tenant_<slug>` on that database. The same visible email may exist in two institutes. Inside one institute, email and RUT stay unique.

## Done when

- The tenant form has a data-mode control. Own database keeps the current Supabase fields. Shared database hides those fields and stores Pulsar's URL and keys.
- `platform_tenants.data_mode` and `postgres_schema` persist. Migration `006_institute_data_plane.sql` is applied on save when `PULSAR_DATABASE_URL` is set.
- Create of a shared institute creates schema `tenant_<slug>`, applies product migrations with the in-memory rewrite, skips brand-data files, and records the ledger.
- One trigger on `auth.users` dispatches into the institute schema from `raw_user_meta_data.tenant_schema`.
- Server and browser clients send PostgREST to that schema. Storage object keys start with `tenant_<slug>/`.
- Auth accounts for a shared institute use plus-addressing (`local+tenant_slug@domain`) so mail still reaches the visible inbox. Login with the visible email maps to that account.

## Out of scope

- Creating a Supabase project from the UI.
- Vercel Domains API. The host list still saves `{slug}.<pulsar apex>` and any custom host the staff type. TLS for a new apex still needs the wildcard or a later domain attach.
- Moving an existing project-mode institute into a shared schema.

## Surfaces (Web vs PWA)

Tier B — desktop-only admin. No PWA tree. The public login hook changes the email sent to Auth and stays the same on web and PWA.

## Data

- `data_mode`: `project` | `shared_schema`.
- `postgres_schema`: `public` for project mode, `tenant_<slug>` for shared mode (`-` in the slug becomes `_`).
- Shared credentials come from `PULSAR_SUPABASE_URL`, `PULSAR_SUPABASE_ANON_KEY`, `PULSAR_SUPABASE_SERVICE_ROLE_KEY`, and `PULSAR_DATABASE_URL`.
