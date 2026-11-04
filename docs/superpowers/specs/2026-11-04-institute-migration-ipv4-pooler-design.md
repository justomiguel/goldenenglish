# Institute migration apply — IPv4 session pooler

**Date:** 2026-11-04
**Status:** Approved in chat ("deja explicado como hacerlo para que se haga siempre así")

## Intent

`npm run sql:apply-migration:all-tenants:pg` must reach every institute from a machine that has no IPv6 route.

## Done when

- A `database_url` whose host is `db.<ref>.supabase.co` and has no IPv4 address is opened as `postgres.<ref>` on the session pooler, port 5432, with `sslmode=no-verify`.
- A URL that already resolves over IPv4, including an existing pooler URL, is left unchanged.
- The winning pooler host is cached in gitignored `scripts/.institute-pooler-hosts.json`.
- Rule `45-institute-migration-apply.mdc` states this path. Agents keep using the one apply command. They do not open `psql` per institute.

## Out of scope

- Rewriting `platform_tenants.database_url`.
- Pulsar control-plane migrations.
