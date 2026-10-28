-- Persist {slug}.{pulsar-apex} on each institute so nago.centrolisto.cl
-- resolves from platform_tenants.hosts. Apexes come from platform_settings.
-- Strip www. Do not write localhost.

with apexes as (
  select distinct
    case
      when host like 'www.%' then substring(host from 5)
      else host
    end as apex
  from public.platform_settings
  cross join lateral unnest(pulsar_hosts) as host
  where id = 'default'
    and host is not null
    and length(btrim(host)) > 0
    and host not in ('localhost')
    and host not like '%.localhost'
),
preview as (
  select
    t.slug,
    t.hosts || coalesce(
      array(
        select t.slug || '.' || a.apex
        from apexes a
        where t.slug || '.' || a.apex <> all (coalesce(t.hosts, array[]::text[]))
      ),
      array[]::text[]
    ) as next_hosts
  from public.platform_tenants t
)
update public.platform_tenants as t
set
  hosts = p.next_hosts,
  updated_at = now()
from preview p
where t.slug = p.slug
  and t.hosts is distinct from p.next_hosts;
