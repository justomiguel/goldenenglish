-- Contact-form mail for a free site. Separate from pulsar_mail_quota.

alter table public.platform_tenants
  add column if not exists free_contact_mail_quota integer not null default 50,
  add column if not exists free_contact_mail_sent integer not null default 0;

alter table public.platform_tenants
  drop constraint if exists platform_tenants_free_contact_mail_quota_check;

alter table public.platform_tenants
  add constraint platform_tenants_free_contact_mail_quota_check
  check (free_contact_mail_quota >= 0 and free_contact_mail_quota <= 100000);

alter table public.platform_tenants
  drop constraint if exists platform_tenants_free_contact_mail_sent_check;

alter table public.platform_tenants
  add constraint platform_tenants_free_contact_mail_sent_check
  check (free_contact_mail_sent >= 0);

create or replace function public.reserve_free_contact_mail(p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if not exists (
    select 1
    from public.platform_tenant_owners o
    where o.tenant_slug = p_slug
      and o.plan = 'free'
  ) then
    if exists (select 1 from public.platform_tenants where slug = p_slug) then
      return 'not_free';
    end if;
    return 'missing';
  end if;

  update public.platform_tenants
  set free_contact_mail_sent = free_contact_mail_sent + 1
  where slug = p_slug
    and free_contact_mail_sent < free_contact_mail_quota;
  get diagnostics updated_count = row_count;
  if updated_count = 1 then
    return 'reserved';
  end if;
  return 'quota';
end;
$$;

create or replace function public.release_free_contact_mail(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.platform_tenants
  set free_contact_mail_sent = greatest(free_contact_mail_sent - 1, 0)
  where slug = p_slug
    and exists (
      select 1
      from public.platform_tenant_owners o
      where o.tenant_slug = p_slug
        and o.plan = 'free'
    );
end;
$$;

revoke all on function public.reserve_free_contact_mail(text) from public, anon, authenticated;
revoke all on function public.release_free_contact_mail(text) from public, anon, authenticated;
grant execute on function public.reserve_free_contact_mail(text) to service_role;
grant execute on function public.release_free_contact_mail(text) to service_role;
