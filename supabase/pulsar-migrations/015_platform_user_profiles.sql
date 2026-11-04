-- Personal name and photo for a CentroListo account (owner or staff).
-- Writes go through the service role. The signed-in user can read their row.

create table if not exists public.platform_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  updated_at timestamptz not null default now(),
  constraint platform_user_profiles_display_name_len check (char_length(display_name) <= 80)
);

alter table public.platform_user_profiles enable row level security;

drop policy if exists "platform_user_profiles_select_self" on public.platform_user_profiles;
create policy "platform_user_profiles_select_self"
  on public.platform_user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'platform-avatars',
  'platform-avatars',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
