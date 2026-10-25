-- Pulsar Lab Control Plane Schema (dedicated Pulsar Supabase project)
-- Stores platform staff accounts, client institute tenant configs, and audit logs.
-- RLS is enabled on all tables; `platform_tenants` and `platform_audit_log` have
-- zero anon/authenticated policies so only the server using `service_role` can access them.

create table if not exists public.platform_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.platform_staff enable row level security;

drop policy if exists "platform_staff_select_self" on public.platform_staff;
create policy "platform_staff_select_self"
  on public.platform_staff
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.platform_tenants (
  slug text primary key check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62})$' and slug <> 'pulsar'),
  display_name text not null,
  is_enabled boolean not null default true,
  hosts text[] not null check (coalesce(array_length(hosts, 1), 0) >= 1),
  supabase_url text not null,
  supabase_anon_key text not null,
  supabase_service_role_key text not null,
  database_url text,
  brand_theme_slug text,
  mail_tenant text,
  resend_from_email text,
  resend_api_key text,
  public_url text,
  payment_gateway_secret_encryption_key text,
  whatsapp_access_token text,
  whatsapp_phone_number_id text,
  whatsapp_class_reminder_template_name text,
  vapid_public_key text,
  vapid_private_key text,
  vapid_contact_email text,
  google_maps_api_key text,
  google_maps_map_id text,
  kv_rest_api_url text,
  kv_rest_api_token text,
  debug_login boolean not null default false,
  skip_initial_site_setup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_tenants enable row level security;

create table if not exists public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  actor_email text not null,
  action text not null,
  tenant_slug text not null,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.platform_audit_log enable row level security;

create index if not exists idx_platform_audit_log_created_at
  on public.platform_audit_log (created_at desc);
