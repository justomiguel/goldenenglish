alter table public.platform_settings
  add column if not exists openai_api_key_cipher text;

alter table public.platform_settings
  add column if not exists openai_api_key_last4 text;

alter table public.platform_settings
  drop constraint if exists platform_settings_openai_api_key_last4_check;

alter table public.platform_settings
  add constraint platform_settings_openai_api_key_last4_check
  check (openai_api_key_last4 is null or char_length(openai_api_key_last4) = 4);

create table if not exists public.platform_openai_conversations (
  id uuid primary key,
  host text not null,
  owner_user_id uuid not null,
  model text not null,
  openai_conversation_id text not null,
  instructions text,
  instructions_sent boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists platform_openai_conversations_owner_idx
  on public.platform_openai_conversations (host, owner_user_id, created_at desc)
  where deleted_at is null;

alter table public.platform_openai_conversations enable row level security;
