create table if not exists public.platform_ai_providers (
  id uuid primary key,
  kind text not null,
  label text not null,
  enabled boolean not null default true,
  api_key_cipher text,
  api_key_last4 text,
  endpoint text,
  created_at timestamptz not null default now(),
  constraint platform_ai_providers_kind_check check (kind in ('openai', 'azure')),
  constraint platform_ai_providers_last4_check check (api_key_last4 is null or char_length(api_key_last4) = 4)
);

create table if not exists public.platform_ai_service_bindings (
  service text primary key,
  provider_id uuid not null references public.platform_ai_providers (id)
);

create table if not exists public.platform_ai_threads (
  id uuid primary key,
  service text not null,
  host text not null,
  owner_user_id uuid not null,
  provider_id uuid not null,
  memory_mode text not null,
  model text not null,
  provider_thread_id text,
  instructions text,
  instructions_sent boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint platform_ai_threads_memory_mode_check check (memory_mode in ('provider_thread', 'system_log'))
);

create index if not exists platform_ai_threads_owner_idx
  on public.platform_ai_threads (host, owner_user_id, created_at desc)
  where deleted_at is null;

create table if not exists public.platform_ai_turns (
  id uuid primary key,
  thread_id uuid not null,
  role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  folded_at timestamptz,
  constraint platform_ai_turns_role_check check (role in ('developer', 'user', 'assistant', 'summary'))
);

create index if not exists platform_ai_turns_thread_idx
  on public.platform_ai_turns (thread_id, created_at);

alter table public.platform_ai_providers enable row level security;
alter table public.platform_ai_service_bindings enable row level security;
alter table public.platform_ai_threads enable row level security;
alter table public.platform_ai_turns enable row level security;

insert into public.platform_ai_providers (id, kind, label, enabled, api_key_cipher, api_key_last4)
select gen_random_uuid(), 'openai', 'OpenAI', true, openai_api_key_cipher, openai_api_key_last4
from public.platform_settings
where id = 'default'
  and openai_api_key_cipher is not null
  and not exists (select 1 from public.platform_ai_providers where kind = 'openai');

insert into public.platform_ai_service_bindings (service, provider_id)
select 'conversation', id
from public.platform_ai_providers
where kind = 'openai'
  and not exists (select 1 from public.platform_ai_service_bindings where service = 'conversation')
order by created_at desc
limit 1
on conflict (service) do nothing;
