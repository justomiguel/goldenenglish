# Shared-schema new user trigger

**Intent:** An admin invite on a shared-schema institute creates the Auth user. The profile insert uses the tenant enum for `role`.

**Done when:**

- `public.dispatch_institute_new_user` casts `role` to `<schema>.user_role` inside the dynamic `INSERT`.
- The role text follows the same rules as `public.handle_new_user`: `admin_invite` may be `admin`, `teacher`, `student`, `parent`, or `assistant`; `bootstrap_wizard` may be `admin`; every other value is `student`.
- The schema name still has to match `tenant_[a-z0-9_]{1,50}` before the function uses it in `format`.
- A pure test locks the cast and the role list. The test does not open a database.
- The function SQL lives in its own module. `provisionSharedInstituteSchema.ts` stays at or under 250 lines.
- After the code change, the same SQL is installed on the shared database that already hosts matiss. A later provision also installs it, because provision already runs this SQL after the migration loop.
- The install connection uses the IPv4 session pooler when `databaseUrl` is `db.<ref>.supabase.co` and that host has no A record. The stored URL is not rewritten.

**Out of scope:**

- The generic Auth sentence on the invite screen.
- Duplicate national ID failures.
- `savePlatformOperatorAdminPassword` and its direct IPv6 connect.
- A row in `supabase/migrations/`. The rewriter would copy this function into each tenant schema and would replace the single trigger on `auth.users`.

## Cause

GoTrue inserts `auth.users`. The trigger `public.dispatch_institute_new_user` then inserts `tenant_<slug>.profiles`. It passes `role` as `text`. The column type is the enum `user_role` in that tenant schema. Postgres rejects the insert. GoTrue returns `Database error creating new user` with status 500. The invite screen shows the `unexpected` sentence and the incident id.

The operator admin row is not created by this trigger. Its profile insert uses an untyped `'admin'` literal, and its Auth metadata has no `tenant_schema`.

## Decision

Keep one trigger on `auth.users`. Cast the role in the dynamic statement: `$2::%I.user_role`, with the same schema name as the profile table. Choose the role text in PL/pgSQL before the `EXECUTE`, from `provisioning_source` and `role` in `raw_user_meta_data`.

## Surfaces (Web vs PWA)

No screen change. The admin invite is Tier B and has no PWA tree. Shared hooks and actions keep their current arguments. The PWA trees do not call this trigger.

## Tests

- The exported SQL contains `$2::%I.user_role`.
- The exported SQL contains the `admin_invite` role list and the `bootstrap_wizard` admin branch.
- The exported SQL still returns without an insert when `tenant_schema` is missing or fails the name check.

## Apply

Run the function SQL once on the shared database after the code change. Use `resolveInstituteDatabaseUrl` so a direct host with no IPv4 address opens the session pooler. Do not edit `platform_tenants.database_url`.
