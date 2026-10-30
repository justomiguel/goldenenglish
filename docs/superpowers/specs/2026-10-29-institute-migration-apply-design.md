# Institute migration apply (project database vs shared schema)

**Intent:** One product migration file, written for `public`. One command applies it to every institute. An external Supabase project receives the file unchanged. An institute stored as a schema inside the shared database receives a rewritten copy in memory. The file in git stays as written.

**Done when:**

- `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/<file>.sql` is the only apply path agents use.
- Targets come from Pulsar `platform_tenants` when `PULSAR_DATABASE_URL` is set. Otherwise they come from `TENANTS_CONFIG_JSON`. Each target has `data_mode` `project` or `shared_schema`.
- `project`: execute the SQL on that `database_url` with no rewrite.
- `shared_schema`: reject the file when a product object (`table`, `function`, `view`, `type`, `sequence`) is created without a `public.` qualifier. Skip brand-data files. Otherwise rewrite `public.` and `search_path = public` to `tenant_<slug>`, prepend `SET search_path`, execute on that database, and insert `institute_migration_ledger.applied`.
- `auth.` and `storage.` stay unchanged.
- Brand-data files still run on `project` targets.
- A Cursor rule (`alwaysApply`) tells agents to write `public.` SQL and to apply only through that command.
- Pulsar migration adds `data_mode` and `postgres_schema` on `platform_tenants` with defaults `project` and `public`.

**Out of scope:**

- Admin UI to create institutes, Vercel domains, Auth email namespacing, Storage prefixes, and cloning a schema.
- Applying this change to a live database from the agent session.
- Rewriting historical migration files in git.

## Surfaces (Web vs PWA)

No screen, route, or shared UI hook. Tier B control-plane only. No PWA tree.

## Decisions

- The git file is the external-project form. The rewriter output is not committed.
- `supabase/pulsar-migrations/` is the control plane. This command does not run those files and does not rewrite them into tenant schemas.
- The ledger table is created on the shared product database in schema `institute_migration_ledger`, not inside a tenant schema and not by a product migration.
- Enum and kind migrations are product SQL. They are not brand-data skips. Brand-data skips match a file name that contains a brand slug plus `seed`, `tagline`, or `brand`.
