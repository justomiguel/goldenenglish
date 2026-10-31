-- Shared Pulsar mail allowance for institutes that have no Resend key.

alter table public.platform_tenants
  add column if not exists pulsar_mail_quota integer not null default 50,
  add column if not exists pulsar_mail_sent integer not null default 0;

alter table public.platform_tenants
  drop constraint if exists platform_tenants_pulsar_mail_quota_check;

alter table public.platform_tenants
  add constraint platform_tenants_pulsar_mail_quota_check
  check (pulsar_mail_quota >= 0 and pulsar_mail_quota <= 100000);

alter table public.platform_tenants
  drop constraint if exists platform_tenants_pulsar_mail_sent_check;

alter table public.platform_tenants
  add constraint platform_tenants_pulsar_mail_sent_check
  check (pulsar_mail_sent >= 0);

create or replace function public.reserve_platform_tenant_mail(p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.platform_tenants
  set pulsar_mail_sent = pulsar_mail_sent + 1
  where slug = p_slug
    and pulsar_mail_sent < pulsar_mail_quota;
  get diagnostics updated_count = row_count;
  if updated_count = 1 then
    return 'reserved';
  end if;
  if exists (select 1 from public.platform_tenants where slug = p_slug) then
    return 'quota';
  end if;
  return 'missing';
end;
$$;

create or replace function public.release_platform_tenant_mail(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.platform_tenants
  set pulsar_mail_sent = greatest(pulsar_mail_sent - 1, 0)
  where slug = p_slug;
end;
$$;

revoke all on function public.reserve_platform_tenant_mail(text) from public, anon, authenticated;
revoke all on function public.release_platform_tenant_mail(text) from public, anon, authenticated;
grant execute on function public.reserve_platform_tenant_mail(text) to service_role;
grant execute on function public.release_platform_tenant_mail(text) to service_role;
