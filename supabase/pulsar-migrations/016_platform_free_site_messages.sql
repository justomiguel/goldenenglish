-- Visitor messages from a free-site contact form.
-- Writes go through the service role. There is no client policy.

create table if not exists public.platform_free_site_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  visitor_name text not null,
  visitor_email text not null,
  visitor_phone text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  constraint platform_free_site_messages_name_len check (char_length(visitor_name) between 1 and 120),
  constraint platform_free_site_messages_email_len check (char_length(visitor_email) between 3 and 200),
  constraint platform_free_site_messages_phone_len check (char_length(visitor_phone) <= 40),
  constraint platform_free_site_messages_body_len check (char_length(body) between 1 and 4000)
);

create index if not exists platform_free_site_messages_slug_created_idx
  on public.platform_free_site_messages (tenant_slug, created_at desc);

alter table public.platform_free_site_messages enable row level security;
