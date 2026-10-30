-- Account approval and Pulsar's own Resend settings.
-- Additive. Existing owner rows stay pending until staff approve them.

alter table public.platform_owners
  add column if not exists status text not null default 'pending';

alter table public.platform_owners
  drop constraint if exists platform_owners_status_check;

alter table public.platform_owners
  add constraint platform_owners_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.platform_settings
  add column if not exists resend_api_key text,
  add column if not exists resend_from_email text,
  add column if not exists notify_email text;
