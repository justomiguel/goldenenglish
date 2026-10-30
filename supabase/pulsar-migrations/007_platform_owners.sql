-- Owners who register on Pulsar and the sites they created.
-- Service role writes. A signed-in user may read only their own rows.

create table if not exists public.platform_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.platform_owners enable row level security;

drop policy if exists "platform_owners_select_self" on public.platform_owners;
create policy "platform_owners_select_self"
  on public.platform_owners
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.platform_tenant_owners (
  tenant_slug text primary key references public.platform_tenants(slug) on delete cascade,
  owner_user_id uuid not null references public.platform_owners(user_id) on delete cascade,
  plan text not null default 'free' check (plan = 'free'),
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_tenant_owners_owner
  on public.platform_tenant_owners (owner_user_id);

alter table public.platform_tenant_owners enable row level security;

drop policy if exists "platform_tenant_owners_select_self" on public.platform_tenant_owners;
create policy "platform_tenant_owners_select_self"
  on public.platform_tenant_owners
  for select
  to authenticated
  using (auth.uid() = owner_user_id);
