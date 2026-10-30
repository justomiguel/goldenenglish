-- Institute data plane marker on the Pulsar control plane.
-- Existing rows stay an external Supabase project (public).
-- shared_schema rows name the Postgres schema inside the shared database.

alter table public.platform_tenants
  add column if not exists data_mode text not null default 'project';

alter table public.platform_tenants
  drop constraint if exists platform_tenants_data_mode_check;

alter table public.platform_tenants
  add constraint platform_tenants_data_mode_check
  check (data_mode in ('project', 'shared_schema'));

alter table public.platform_tenants
  add column if not exists postgres_schema text not null default 'public';

alter table public.platform_tenants
  drop constraint if exists platform_tenants_postgres_schema_check;

alter table public.platform_tenants
  add constraint platform_tenants_postgres_schema_check
  check (
    (data_mode = 'project' and postgres_schema = 'public')
    or (data_mode = 'shared_schema' and postgres_schema ~ '^tenant_[a-z0-9_]{1,50}$')
  );
