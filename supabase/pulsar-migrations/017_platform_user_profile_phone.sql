-- The person's phone stays on the account. Each institute keeps its own public contact.

alter table public.platform_user_profiles
  add column if not exists phone text not null default '';

alter table public.platform_user_profiles
  drop constraint if exists platform_user_profiles_phone_len;

alter table public.platform_user_profiles
  add constraint platform_user_profiles_phone_len
  check (char_length(phone) <= 40);
