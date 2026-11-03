alter table public.platform_tenants
  add column if not exists commercial_plan text not null default 'gestion';

alter table public.platform_tenants
  drop constraint if exists platform_tenants_commercial_plan_check;

alter table public.platform_tenants
  add constraint platform_tenants_commercial_plan_check
  check (commercial_plan in ('pagina', 'gestion', 'ecosistema'));

alter table public.platform_tenants
  add column if not exists daily_api_key text;

alter table public.platform_tenants
  add column if not exists daily_domain text;
