-- Centro Listo (formerly Pulsar Lab): add centrolisto.cl and www.centrolisto.cl to platform_settings.pulsar_hosts.

alter table public.platform_settings
  alter column pulsar_hosts
  set default array['centrolisto.cl', 'www.centrolisto.cl', 'pulsarlab.cl', 'www.pulsarlab.cl', 'pulsarlab.vercel.app'];

insert into public.platform_settings (id, pulsar_hosts)
values ('default', array['centrolisto.cl', 'www.centrolisto.cl', 'pulsarlab.cl', 'www.pulsarlab.cl', 'pulsarlab.vercel.app'])
on conflict (id) do update
  set pulsar_hosts = array(
    select distinct unnest(
      public.platform_settings.pulsar_hosts || array['centrolisto.cl', 'www.centrolisto.cl']
    )
  ),
  updated_at = now();
