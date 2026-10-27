-- Pulsar Lab Control Plane: singleton platform_settings table for Pulsar platform hosts.
-- Allows adding or removing Pulsar domains without redeploying Vercel.
-- RLS is enabled with zero anon/authenticated policies so only server code using `service_role` can read or mutate it.

create table if not exists public.platform_settings (
  id text primary key default 'default' check (id = 'default'),
  pulsar_hosts text[] not null default array['pulsarlab.cl', 'www.pulsarlab.cl', 'pulsarlab.vercel.app']
    check (coalesce(array_length(pulsar_hosts, 1), 0) >= 1),
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

insert into public.platform_settings (id, pulsar_hosts)
values ('default', array['pulsarlab.cl', 'www.pulsarlab.cl', 'pulsarlab.vercel.app'])
on conflict (id) do nothing;
